import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose, { Schema, model, models } from 'mongoose'

const OrderSchema = new Schema({
  orderId: String,
  captureId: String,
  status: String,
  currency: String,
  totals: { items: Number, shipping: Number, total: Number },
  payer: { name: String, email: String },
  items: [{
    id: String,
    productId: String,
    inventoryId: Number,
    name: String,
    price: Number,
    qty: Number,
    imageUrl: String,
  }],
}, { timestamps: true })
const Order = models.Order || model('Order', OrderSchema, 'orders')

const ProductSchema = new Schema({
  inventoryId: { type: Number, index: true },
  name: String,
  itemNo: String,
  price: Number,
  qty: Number,
  type: String,
}, { timestamps: true })
const Product = models.Product || model('Product', ProductSchema, 'products')

function paypalBase() {
  return (process.env.PAYPAL_ENV || 'live') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken() {
  const cid = process.env.PAYPAL_CLIENT_ID!
  const sec = process.env.PAYPAL_CLIENT_SECRET!
  const r = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${cid}:${sec}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`paypal_token_failed ${r.status}: ${t}`)
  }
  const j:any = await r.json()
  return j.access_token as string
}

async function getOrder(accessToken: string, orderId: string) {
  const r = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  if (!r.ok) throw new Error(`paypal_get_order_failed ${r.status}`)
  return r.json() as any
}

async function refundCapture(accessToken: string, captureId: string) {
  const r = await fetch(`${paypalBase()}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  const j:any = await r.json()
  if (!r.ok) {
    const msg = j?.name || j?.message || `paypal_refund_failed`
    const det = j?.details?.[0]?.issue
    throw new Error(`${msg}${det ? `:${det}`:''} (${r.status})`)
  }
  return j
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const captureId = String(req.query.captureId || '')
    const orderId = String(req.query.orderId || '')
    if (!captureId && !orderId) {
      return res.status(400).json({ error: 'missing_id', message: 'Provide captureId or orderId' })
    }

    // 1) Locate the saved order (if any)
    let orderDoc = null as any
    if (captureId) orderDoc = await Order.findOne({ captureId }).lean()
    if (!orderDoc && orderId) orderDoc = await Order.findOne({ orderId }).lean()

    // 2) If we only got orderId, resolve captureId from PayPal
    let capId = captureId
    const token = await getAccessToken()
    if (!capId && orderId) {
      const o = await getOrder(token, orderId)
      capId = o?.purchase_units?.[0]?.payments?.captures?.[0]?.id
      if (!capId) return res.status(404).json({ error: 'capture_not_found_for_order', orderId })
    }

    // 3) Refund on PayPal
    const refund = await refundCapture(token, capId!)

    // 4) Restock locally if we have an order doc with items
    let restockedCount = 0
    if (orderDoc?.items?.length) {
      for (const it of orderDoc.items) {
        const qty = Math.max(1, Number(it.qty || 1))
        if (it.inventoryId) {
          await Product.updateOne({ inventoryId: Number(it.inventoryId) }, { $inc: { qty } })
          restockedCount += qty
        } else if (it.productId) {
          await Product.updateOne({ _id: new mongoose.Types.ObjectId(it.productId) }, { $inc: { qty } })
          restockedCount += qty
        } else if (it.id && /^[0-9a-f]{24}$/i.test(it.id)) {
          await Product.updateOne({ _id: new mongoose.Types.ObjectId(it.id) }, { $inc: { qty } })
          restockedCount += qty
        }
      }
    }

    // 5) Update order status if present
    if (orderDoc?._id) {
      await Order.updateOne({ _id: orderDoc._id }, { $set: { status: 'REFUNDED', refund } })
    }

    res.json({ ok: true, refundedCaptureId: capId, restockedCount, refund })
  } catch (err:any) {
    res.status(500).json({ error: 'refund_restock_failed', message: err.message })
  }
}