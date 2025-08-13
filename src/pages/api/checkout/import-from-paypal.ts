import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'

/** Simple Order model (inline so it always exists) */
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, index: true },
    captureId: { type: String, index: true },
    status: String,
    payer: {
      name: Object,
      email_address: String,
      payer_id: String,
    },
    amounts: Object,  // { order, capture } raw structs
    items: Array,     // cart lines (unknown for imports → [])
    totals: Object,   // { itemsTotal, postage, grandTotal, currency }
    raw: Object,      // full PayPal payloads
  },
  { timestamps: true, strict: false }
)
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)

/** PayPal helpers */
function ppBase() {
  const env = (process.env.PAYPAL_ENV || 'live').toLowerCase()
  return env === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com'
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
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`paypal_token_failed ${res.status}: ${t}`)
  }
  const json = await res.json()
  return json.access_token as string
}

async function fetchOrder(token: string, orderId: string) {
  const r = await fetch(`${ppBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const j = await r.json()
  if (!r.ok) {
    const msg = j?.message || 'order_fetch_failed'
    throw new Error(`${msg} (${r.status})`)
  }
  return j
}

async function fetchCapture(token: string, captureId: string) {
  const r = await fetch(`${ppBase()}/v2/payments/captures/${captureId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const j = await r.json()
  if (!r.ok) {
    const msg = j?.message || 'capture_fetch_failed'
    throw new Error(`${msg} (${r.status})`)
  }
  return j
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orderId = (req.query.orderId as string) || ''
    const captureId = (req.query.captureId as string) || ''

    if (!orderId && !captureId) {
      return res.status(422).json({ error: 'missing_id', hint: 'Pass ?orderId=... OR ?captureId=...' })
    }

    await dbConnect(process.env.MONGODB_URI!)
    const token = await getAccessToken()

    let ord: any = null
    let cap: any = null
    let resolvedOrderId = orderId
    let resolvedCaptureId = captureId

    if (captureId) {
      // 1) Look up the capture
      cap = await fetchCapture(token, captureId)

      // 2) Try to find the related order from capture.links (rel: "up")
      const up = Array.isArray(cap?.links) ? cap.links.find((l: any) => l.rel === 'up') : null
      if (up?.href?.includes('/v2/checkout/orders/')) {
        resolvedOrderId = up.href.split('/').pop()
      }

      // If we found an order id, fetch the order too
      if (resolvedOrderId) {
        ord = await fetchOrder(token, resolvedOrderId)
      }
    } else {
      // Given an orderId directly
      ord = await fetchOrder(token, orderId)
      const pu = ord?.purchase_units?.[0]
      const captures = pu?.payments?.captures
      if (Array.isArray(captures) && captures.length) {
        resolvedCaptureId = captures[0]?.id || null
      }
    }

    if (!ord && !cap) {
      return res.status(404).json({ error: 'not_found', message: 'Could not resolve order or capture for this ID with your current PayPal credentials.' })
    }

    // Upsert if exists
    if (resolvedOrderId) {
      const existing = await Order.findOne({ orderId: resolvedOrderId }).lean()
      if (existing) {
        return res.status(200).json({ ok: true, imported: false, order: existing })
      }
    }

    const pu = ord?.purchase_units?.[0] || null
    const capAmt = cap?.amount
    const ordAmt = pu?.amount
    const currency = (capAmt?.currency_code || ordAmt?.currency_code || 'AUD') as string
    const grand = Number(capAmt?.value || ordAmt?.value || 0)

    const doc = await Order.create({
      orderId: resolvedOrderId || null,
      captureId: resolvedCaptureId || null,
      status: (cap?.status || ord?.status || 'COMPLETED') as string,
      payer: ord?.payer || {},
      amounts: { order: ordAmt, capture: capAmt },
      items: [], // unknown for imported historical orders
      totals: { itemsTotal: grand, postage: 0, grandTotal: grand, currency },
      raw: { order: ord, capture: cap },
    })

    return res.status(200).json({ ok: true, imported: true, order: doc })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'import_failed' })
  }
}