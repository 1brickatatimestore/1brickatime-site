import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import Order from '@/models/Order'

const PP_BASE = 'https://api-m.paypal.com' // live (you already run live)

function authHeader() {
  const id = process.env.PAYPAL_CLIENT_ID || ''
  const secret = process.env.PAYPAL_CLIENT_SECRET || ''
  const basic = Buffer.from(`${id}:${secret}`).toString('base64')
  return { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' }
}

async function paypalGetOrder(orderId: string) {
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: authHeader(),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`paypal_get_order_failed ${r.status}`)
  return r.json()
}

async function paypalCapture(orderId: string) {
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: authHeader(),
    cache: 'no-store',
    body: JSON.stringify({}),
  })
  // If already captured, PayPal can 422 with ORDER_ALREADY_CAPTURED – fallback to GET
  if (!r.ok) {
    const txt = await r.text().catch(() => '')
    if (r.status === 422 && txt.includes('ORDER_ALREADY_CAPTURED')) {
      return paypalGetOrder(orderId)
    }
    throw new Error(`paypal_capture_failed ${r.status} ${txt}`)
  }
  return r.json()
}

function trim(val: any) {
  try {
    // Keep only what we need to troubleshoot; avoid storing full payloads forever
    const pu = val?.purchase_units?.[0] || {}
    const capture =
      pu?.payments?.captures?.[0] ||
      val?.purchase_units?.[0]?.payments?.captures?.[0]
    return {
      id: val?.id,
      intent: val?.intent,
      status: val?.status,
      purchase_units: [
        {
          reference_id: pu?.reference_id,
          amount: pu?.amount,
          payee: { merchant_id: pu?.payee?.merchant_id },
          shipping: pu?.shipping,
          items: pu?.items,
          payments: {
            captures: capture
              ? [
                  {
                    id: capture.id,
                    status: capture.status,
                    amount: capture.amount,
                    create_time: capture.create_time,
                    update_time: capture.update_time,
                  },
                ]
              : [],
          },
        },
      ],
      payer: val?.payer
        ? {
          email_address: val?.payer?.email_address,
          payer_id: val?.payer?.payer_id,
          name: val?.payer?.name,
          address: val?.payer?.address,
        }
        : undefined,
    }
  } catch {
    return val
  }
}

function parseNumber(n: any) {
  const v = typeof n === 'string' ? parseFloat(n) : Number(n || 0)
  return isFinite(v) ? v : 0
}

function toInt(n: any) {
  const x = parseInt(String(n), 10)
  return isFinite(x) ? x : undefined
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { orderId } = req.body || {}
  if (!orderId) {
    return res.status(400).json({ error: 'missing_orderId' })
  }

  try {
    await dbConnect()

    // 1) Capture (or load) order from PayPal
    const cap = await paypalCapture(orderId)

    // 2) Extract captureId / items / payer / totals
    const pu = cap?.purchase_units?.[0] || {}
    const capture = pu?.payments?.captures?.[0]
    const captureId = capture?.id || null
    const status = (capture?.status || cap?.status || 'COMPLETED') as string

    const currency = capture?.amount?.currency_code || pu?.amount?.currency_code || process.env.NEXT_PUBLIC_CURRENCY || 'AUD'
    const itemsRaw: any[] = Array.isArray(pu?.items) ? pu.items : []

    const items = itemsRaw.map((it) => {
      const qty = toInt(it.quantity) || 1
      const price = parseNumber(it.unit_amount?.value)
      const sku = String(it.sku ?? '')
      const inventoryId = toInt(sku)
      return {
        inventoryId,
        productId: undefined,
        sku,
        name: it.name,
        price,
        qty,
        imageUrl: undefined,
      }
    })

    const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const postage = parseNumber(pu?.amount?.breakdown?.shipping?.amount?.value)
    const shipping = 0 // if you also pass a custom shipping option, map it here
    const total = parseNumber(capture?.amount?.value || pu?.amount?.value)

    const payer = {
      payerId: cap?.payer?.payer_id || '',
      email: cap?.payer?.email_address || '',
      givenName: cap?.payer?.name?.given_name || '',
      surname: cap?.payer?.name?.surname || '',
      country: cap?.payer?.address?.country_code || '',
    }

    // 3) Decrement stock (best-effort, per line)
    const adjustResults: Array<{ inventoryId?: number; ok: boolean; before?: number; after?: number }> = []

    for (const li of items) {
      if (!li.inventoryId) {
        adjustResults.push({ inventoryId: undefined, ok: false })
        continue
      }
      // Find by inventoryId and reduce qty atomically if possible
      const prod = await Product.findOne({ inventoryId: li.inventoryId }).lean()
      if (!prod) {
        adjustResults.push({ inventoryId: li.inventoryId, ok: false })
        continue
      }
      const before = Number(prod.qty || 0)
      const dec = Math.min(before, li.qty)
      const updated = await Product.findOneAndUpdate(
        { _id: prod._id, qty: { $gte: dec } },
        { $inc: { qty: -dec } },
        { new: true }
      ).lean()

      adjustResults.push({
        inventoryId: li.inventoryId,
        ok: !!updated,
        before,
        after: updated ? Number(updated.qty || 0) : before,
      })
    }

    // 4) Save local Order document
    const saved = await Order.create({
      provider: 'paypal',
      orderId,
      captureId,
      status,
      items,
      totals: {
        items: itemsTotal,
        postage,
        shipping,
        total,
        currency,
      },
      payer,
      raw: trim(cap),
    })

    // 5) Fire-and-forget: send confirmation email if you created that endpoint
    ;(async () => {
      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/send-confirmation?orderId=${encodeURIComponent(saved._id.toString())}`)
        }
      } catch { /* ignore */ }
    })()

    return res.status(200).json({
      ok: true,
      orderId,
      captureId,
      status,
      totals: { items: itemsTotal, postage, shipping, total, currency },
      stockAdjustments: adjustResults,
      savedId: saved._id,
    })
  } catch (err: any) {
    console.error('paypal-capture error', err?.message || err)
    return res.status(500).json({ error: 'capture_failed', message: String(err?.message || err) })
  }
}