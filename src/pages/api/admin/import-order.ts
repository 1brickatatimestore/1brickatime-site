import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import PayPalOrder from '@/models/PayPalOrder'

const MONGODB_URI = process.env.MONGODB_URI || ''
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase() // 'live' | 'sandbox'
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''

async function db() {
  if (mongoose.connection.readyState === 1) return
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI')
  await mongoose.connect(MONGODB_URI)
}

function paypalBase() {
  return PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
}

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`paypal_oauth_failed ${res.status} ${t}`)
  }
  const data = await res.json()
  return data.access_token as string
}

async function fetchOrder(orderId: string, accessToken: string) {
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`paypal_get_order_failed ${res.status} ${t}`)
  }
  return res.json()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // --- simple admin guard ---
    const token = (req.headers['x-admin-token'] as string) || (req.query.adminToken as string)
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' })
    }

    const orderId =
      (req.method === 'POST' ? req.body?.orderId : req.query.orderId) as string | undefined
    if (!orderId) return res.status(400).json({ ok: false, error: 'missing_order_id' })

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ ok: false, error: 'paypal_not_configured' })
    }

    await db()
    const accessToken = await getAccessToken()
    const order = await fetchOrder(orderId, accessToken)

    // Normalize a few useful fields
    const payerEmail =
      order?.payer?.email_address ||
      order?.payment_source?.paypal?.email_address ||
      undefined
    const payerName =
      order?.payer?.name?.given_name || order?.payer?.name?.surname
        ? `${order?.payer?.name?.given_name || ''} ${order?.payer?.name?.surname || ''}`.trim()
        : undefined

    const captures =
      order?.purchase_units?.[0]?.payments?.captures?.map((c: any) => ({
        captureId: c.id,
        status: c.status,
        amount: c.amount,
        create_time: c.create_time,
        update_time: c.update_time,
      })) || []

    const grossAmount =
      order?.purchase_units?.[0]?.amount?.value
        ? {
            currency_code: order?.purchase_units?.[0]?.amount?.currency_code,
            value: order?.purchase_units?.[0]?.amount?.value,
          }
        : undefined

    // Upsert
    const saved = await PayPalOrder.findOneAndUpdate(
      { orderId: order.id },
      {
        orderId: order.id,
        intent: order.intent,
        status: order.status,
        payerEmail,
        payerName,
        grossAmount,
        captures,
        raw: order,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return res.json({ ok: true, orderId: saved.orderId, status: saved.status, captures: saved.captures })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ ok: false, error: err.message || 'import_failed' })
  }
}