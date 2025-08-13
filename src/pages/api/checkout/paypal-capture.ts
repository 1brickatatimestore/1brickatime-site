import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'
import { sendOrderEmail } from '@/lib/mailer'

type PayPalCapture = any

function ppBase() {
  const env = (process.env.PAYPAL_ENV || 'live').toLowerCase()
  return env === 'live'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'
}

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID!
  const secret = process.env.PAYPAL_CLIENT_SECRET!
  const res = await fetch(`${ppBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`paypal_token_failed ${res.status}`)
  const json = await res.json()
  return json.access_token as string
}

async function captureOrder(orderId: string, accessToken: string) {
  const res = await fetch(`${ppBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `cap_${orderId}_${Date.now()}`,
    },
    body: JSON.stringify({}),
  })
  const json = await res.json()
  if (!res.ok) {
    const err = new Error('paypal_capture_failed') as any
    err.details = json
    throw err
  }
  return json as PayPalCapture
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const testMode = String(process. PAYPAL_CLIENT_SECRET_REDACTED|| '').trim()
  const isTest = testMode === '1' || /^true$/i.test(testMode)

  try {
    await dbConnect(process.env.MONGODB_URI!)
  } catch {
    // still try to proceed; email will still be sent even if DB fails
  }

  try {
    const orderId =
      (req.query.orderId as string) ||
      (typeof req.body?.orderId === 'string' ? req.body.orderId : '')

    if (!orderId) return res.status(422).json({ error: 'missing_orderId' })

    // TEST MODE: do not hit PayPal; pretend we captured successfully
    let captured: any
    if (isTest) {
      captured = {
        id: orderId,
        status: 'COMPLETED',
        testMode: true,
        purchase_units: req.body?.purchase_units || [],
      }
    } else {
      const token = await getAccessToken()
      captured = await captureOrder(orderId, token)
    }

    // Extract capture + totals
    const pu = (captured?.purchase_units && captured.purchase_units[0]) || {}
    const cap =
      (pu?.payments?.captures && pu.payments.captures[0]) ||
      (pu?.payments?.authorizations && pu.payments.authorizations[0]) ||
      {}
    const captureId = cap?.id || ''
    const amount = cap?.amount || pu?.amount || {}
    const currency = amount.currency_code || process. PAYPAL_CLIENT_SECRET_REDACTED|| 'AUD'
    const grand = parseFloat(amount.value || '0')

    // Derive items (if your order endpoint stored items in body on capture call, include that too)
    const items =
      (pu?.items as Array<any>) ||
      (Array.isArray(req.body?.items) ? req.body.items : [])

    // Persist to DB (generic collection to avoid schema mismatch)
    let savedId: string | null = null
    try {
      const doc = {
        orderId,
        captureId,
        status: captured?.status || 'COMPLETED',
        payer: {
          email: captured?.payer?.email_address,
          name:
            captured?.payer?.name?.given_name || captured?.payer?.name?.surname
              ? `${captured?.payer?.name?.given_name ?? ''} ${captured?.payer?.name?.surname ?? ''}`.trim()
              : undefined,
        },
        items: items?.map((it: any) => ({
          name: it.name,
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.unit_amount?.value || it.price || 0),
        })),
        totals: { currency, grand, items: 0, postage: 0 },
        raw: captured,
        createdAt: new Date(),
      }
      doc.totals.items =
        (doc.items || []).reduce((s: number, it: any) => s + (it.price || 0) * (it.qty || 1), 0) || 0

      const cx = (mongoose.connection as any).db
      if (cx) {
        const r = await cx.collection('orders').insertOne(doc)
        savedId = String(r.insertedId)
      }
    } catch {
      // non-fatal
    }

    // Fire-and-forget email (don’t block success if SMTP fails)
    try {
      await sendOrderEmail({
        _id: savedId || undefined,
        orderId,
        captureId,
        payer: { email: captured?.payer?.email_address },
        totals: { currency, grand },
        items: Array.isArray(items)
          ? items.map((it: any) => ({
              name: it.name,
              qty: Number(it.quantity || it.qty || 1),
              price: Number(it.unit_amount?.value || it.price || 0),
            }))
          : undefined,
      })
    } catch {
      // ignore email errors
    }

    // If your UI expects a redirect, keep your existing return handler doing that.
    // Here we just return JSON.
    return res.status(200).json({
      ok: true,
      orderId,
      captureId,
      status: captured?.status || 'COMPLETED',
      totals: { currency, grand },
      savedId,
      testMode: isTest,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'capture_failed', details: err?.details })
  }
}