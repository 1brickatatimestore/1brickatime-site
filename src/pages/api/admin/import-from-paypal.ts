import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { Schema, model, models } from 'mongoose'

// ---- ENV / config ----
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const MONGODB_URI = process.env.MONGODB_URI || ''
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''

const PP_BASE =
  PAYPAL_ENV === 'live'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'

// ---- Mongo connection ----
async function connectMongo() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing')
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(MONGODB_URI)
}

// ---- Minimal Order model (kept local to avoid extra files) ----
const OrderSchema = new Schema(
  {
    provider: { type: String, default: 'paypal', index: true },
    orderId: { type: String, index: true },
    captureIds: { type: [String], index: true },
    payerEmail: String,
    currency: String,
    total: Number,
    status: String,
    items: Array,
    postage: Schema.Types.Mixed,
    shipping: Schema.Types.Mixed,
    rawOrder: Schema.Types.Mixed,
    rawCaptures: [Schema.Types.Mixed],
  },
  { timestamps: true }
)

// Avoid model overwrite in dev
const Order = models.Order || model('Order', OrderSchema)

// ---- PayPal helpers ----
async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials missing')
  }
  const body = new URLSearchParams()
  body.append('grant_type', 'client_credentials')

  const resp = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
          'base64'
        ),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`paypal_token_failed ${resp.status} ${t}`)
  }

  const json = (await resp.json()) as { access_token: string }
  return json.access_token
}

async function getOrder(orderId: string, token: string) {
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`paypal_get_order_failed ${r.status} ${t}`)
  }
  return r.json()
}

async function getCapture(captureId: string, token: string) {
  const r = await fetch(`${PP_BASE}/v2/payments/captures/${captureId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`paypal_get_capture_failed ${r.status} ${t}`)
  }
  return r.json()
}

// ---- Upsert saver ----
async function upsertFromOrder(rawOrder: any, rawCaptures: any[]) {
  const orderId = rawOrder?.id
  const payerEmail =
    rawOrder?.payer?.email_address ||
    rawOrder?.payer?.payer_id ||
    undefined

  // Sum captured amounts if present
  let currency: string | undefined
  let total = 0
  const captureIds: string[] = []

  for (const c of rawCaptures) {
    const amt = c?.amount
    if (amt?.currency_code && amt?.value) {
      currency = amt.currency_code
      total += Number(amt.value)
    }
    if (c?.id) captureIds.push(c.id)
  }

  // Try to read items / shipping from purchase_units
  const pu = Array.isArray(rawOrder?.purchase_units)
    ? rawOrder.purchase_units[0]
    : undefined

  const items = pu?.items || []
  const postage =
    pu?.amount?.breakdown?.shipping || null
  const shipping =
    pu?.shipping || null

  const status = rawOrder?.status || 'SAVED'

  // Upsert
  const doc = await Order.findOneAndUpdate(
    { provider: 'paypal', orderId },
    {
      $set: {
        provider: 'paypal',
        orderId,
        captureIds,
        payerEmail,
        currency,
        total,
        status,
        items,
        postage,
        shipping,
        rawOrder,
        rawCaptures,
      },
    },
    { upsert: true, new: true }
  )

  return doc
}

// ---- Handler ----
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' })
    }

    // Admin auth
    const tokenHeader =
      (req.headers['x-admin-token'] as string) ||
      (req.query.token as string) ||
      ''
    if (!ADMIN_TOKEN || tokenHeader !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    const captureId =
      (req.query.captureId as string) ||
      (req.body?.captureId as string) ||
      ''
    const orderId =
      (req.query.orderId as string) || (req.body?.orderId as string) || ''

    if (!captureId && !orderId) {
      return res
        .status(400)
        .json({ error: 'missing_id', message: 'Provide captureId or orderId' })
    }

    await connectMongo()
    const access = await getAccessToken()

    let rawOrder: any
    let rawCaptures: any[] = []

    if (orderId) {
      rawOrder = await getOrder(orderId, access)
      // Collect captures from purchase_units/payments
      const pu = Array.isArray(rawOrder?.purchase_units)
        ? rawOrder.purchase_units
        : []
      for (const unit of pu) {
        const caps = unit?.payments?.captures || []
        rawCaptures.push(...caps)
      }
    } else if (captureId) {
      const cap = await getCapture(captureId, access)
      rawCaptures = [cap]
      // If the capture includes a link back to order, try to fetch it
      const orderLink = (cap?.links || []).find((l: any) => l.rel === 'up')
      if (orderLink?.href) {
        const parts = orderLink.href.split('/')
        const maybeOrderId = parts[parts.length - 1]
        try {
          rawOrder = await getOrder(maybeOrderId, access)
        } catch {
          // Non-fatal — we can still save with just capture data
          rawOrder = { id: maybeOrderId, status: 'UNKNOWN' }
        }
      } else {
        rawOrder = { id: 'UNKNOWN', status: cap?.status || 'CAPTURED' }
      }
    }

    const saved = await upsertFromOrder(rawOrder, rawCaptures)
    return res.json({
      ok: true,
      orderId: saved.orderId,
      captureIds: saved.captureIds,
      total: saved.total,
      currency: saved.currency,
      status: saved.status,
    })
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: 'import_failed', message: String(err?.message || err) })
  }
}