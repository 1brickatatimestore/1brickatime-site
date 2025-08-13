import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import fetch from 'node-fetch'

// ----- DB -----
const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) throw new Error('MONGODB_URI missing')

const ProductSchema = new mongoose.Schema(
  {
    inventoryId: { type: Number, index: true },
    itemNo: String,
    name: String,
    price: Number,
    qty: Number,
    imageUrl: String,
    type: String,
  },
  { strict: false, collection: 'products' }
)

const OrderSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'paypal' },
    orderId: { type: String, index: true },
    captureIds: [String],
    payer: {
      email: String,
      name: String,
      payerId: String,
    },
    amount: {
      currency: String,
      value: Number,
    },
    items: [
      {
        inventoryId: Number,
        id: String,
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    shipping: {
      name: String,
      address: Object,
    },
    raw: Object,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'orders' }
)

const Product =
  (mongoose.models.Product as mongoose.Model<any>) ||
  mongoose.model('Product', ProductSchema)
const Order =
  (mongoose.models.Order as mongoose.Model<any>) ||
  mongoose.model('Order', OrderSchema)

async function db() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI)
  }
}

// ----- Email (optional, fire-and-forget) -----
async function sendEmailSummary(order: any) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SALES_EMAIL_FROM || user
  const to = process.env.SALES_EMAIL_TO || user
  if (!host || !user || !pass || !from || !to) return

  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass },
  })

  const lines = [
    `Order: ${order.orderId}`,
    `Capture(s): ${order.captureIds.join(', ')}`,
    `Payer: ${order.payer.name} <${order.payer.email}>`,
    `Amount: ${order.amount.currency} ${order.amount.value.toFixed(2)}`,
    '',
    'Items:',
    ...order.items.map(
      (it: any) => `  - ${it.name}  x${it.qty}  @ ${order.amount.currency} ${Number(it.price).toFixed(2)}`
    ),
  ].join('\n')

  await transporter.sendMail({
    from,
    to,
    subject: `New order ${order.orderId}`,
    text: lines,
  })
}

// ----- PayPal helpers -----
const PP_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase()
const PP_CLIENT = process.env.PAYPAL_CLIENT_ID || ''
const PP_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
const PP_BASE =
  PP_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

async function paypalToken() {
  const auth = Buffer.from(`${PP_CLIENT}:${PP_SECRET}`).toString('base64')
  const r = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!r.ok) throw new Error(`paypal_token_failed ${r.status}`)
  const j = (await r.json()) as any
  return j.access_token as string
}

async function captureOrder(orderId: string) {
  const token = await paypalToken()
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `cap-${orderId}`, // idempotency
    },
    body: JSON.stringify({}),
  })
  const body = await r.json()
  if (!r.ok) {
    const code = (body && body.name) || r.status
    throw new Error(`paypal_capture_failed ${code}`)
  }
  return body
}

// Extract a simple order shape we can store & email
function normalizeCapture(capture: any) {
  const purchase = (capture.purchase_units && capture.purchase_units[0]) || {}
  const payments = purchase.payments || {}
  const captures = payments.captures || []
  const captureIds: string[] = captures.map((c: any) => c.id)

  const amount = captures[0]?.amount || purchase.amount || {}
  const payer = {
    email: capture.payer?.email_address || '',
    name:
      capture.payer?.name?.given_name || capture.payer?.name?.surname
        ? `${capture.payer?.name?.given_name || ''} ${capture.payer?.name?.surname || ''}`.trim()
        : '',
    payerId: capture.payer?.payer_id || '',
  }

  // If you included items when creating the order, PayPal echoes them here
  // (and we also try to read our own metadata fields if present)
  const items = (purchase.items || []).map((it: any) => ({
    inventoryId:
      typeof it.custom_id === 'string' && /^\d+$/.test(it.custom_id)
        ? Number(it.custom_id)
        : undefined,
    id: it.sku || it.custom_id || it.name,
    name: it.name,
    qty: Number(it.quantity || 1),
    price: Number(it.unit_amount?.value || it.price || 0),
  }))

  const shipping = {
    name: purchase.shipping?.name?.full_name || '',
    address: purchase.shipping?.address || null,
  }

  return {
    orderId: capture.id,
    captureIds,
    payer,
    amount: {
      currency: amount.currency_code || 'AUD',
      value: Number(amount.value || 0),
    },
    items,
    shipping,
    raw: capture,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
    const { orderId } = (req.body || {}) as { orderId?: string }
    if (!orderId) return res.status(400).json({ error: 'missing_orderId' })

    await db()

    // 1) Capture on PayPal
    const cap = await captureOrder(orderId)

    // 2) Normalize + save
    const order = normalizeCapture(cap)
    // idempotent: upsert by orderId
    const saved = await Order.findOneAndUpdate(
      { orderId: order.orderId },
      order,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()

    // 3) Decrement stock if we have inventoryId for any line
    for (const it of order.items) {
      if (it.inventoryId) {
        await Product.updateOne(
          { inventoryId: it.inventoryId },
          { $inc: { qty: -Number(it.qty || 1) } }
        )
      }
    }

    // 4) Fire-and-forget email (don’t block response)
    sendEmailSummary(order).catch(() => {})

    return res.status(200).json({
      ok: true,
      provider: 'paypal',
      orderId: order.orderId,
      captureIds: order.captureIds,
      saved: true,
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'capture_failed', message: String(err?.message || err) })
  }
}