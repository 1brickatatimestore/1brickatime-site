// src/pages/api/checkout/refund-and-restock.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { Schema, model, models } from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type OrderDoc = {
  _id: any
  provider: 'paypal' | 'stripe' | 'bank'
  orderId?: string
  captureIds?: string[]
  status: string
  payerEmail?: string
  items: OrderItem[]
  totals?: {
    itemsTotal: number
    postage?: number
    grandTotal: number
    currency?: string
  }
  refunds?: Array<{ captureId?: string; orderId?: string; at: Date; amount?: number }>
  raw?: any
  createdAt: Date
  updatedAt: Date
}

const OrderSchema =
  (models.Order as mongoose.Model<OrderDoc>)?.schema ??
  new Schema<OrderDoc>(
    {
      provider: { type: String, default: 'paypal' },
      orderId: { type: String, index: true },
      captureIds: [{ type: String, index: true }],
      status: { type: String, default: 'created', index: true },
      payerEmail: String,
      items: [
        {
          id: String,
          name: String,
          price: Number,
          qty: Number,
          imageUrl: String,
        },
      ],
      totals: {
        itemsTotal: Number,
        postage: Number,
        grandTotal: Number,
        currency: String,
      },
      refunds: [{ captureId: String, orderId: String, at: Date, amount: Number }],
      raw: Schema.Types.Mixed,
    },
    { timestamps: true }
  )

const Order = models.Order || model<OrderDoc>('Order', OrderSchema)

function requireAdminKey(req: NextApiRequest) {
  const expected = process.env.ADMIN_KEY
  if (!expected) return true // if not set, allow (you can tighten later)
  const got =
    (req.headers['x-admin-key'] as string) ||
    (req.query.adminKey as string) ||
    ''
  return got && got === expected
}

function paypalBase() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalToken() {
  const base = paypalBase()
  const id = process.env.PAYPAL_CLIENT_ID!
  const secret = process.env.PAYPAL_CLIENT_SECRET!
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`paypal_token_failed: ${resp.status} ${t}`)
  }
  const json = await resp.json()
  return json.access_token as string
}

async function refundCapture(captureId: string) {
  // If you want full amount auto-refund, empty body is fine
  const base = paypalBase()
  const token = await getPayPalToken()
  const resp = await fetch(`${base}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const txt = await resp.text()
  if (!resp.ok) {
    throw new Error(`paypal_refund_failed: ${resp.status} ${txt}`)
  }
  try {
    return JSON.parse(txt)
  } catch {
    return { ok: true, raw: txt }
  }
}

function looksNumericId(s: string) {
  return /^[0-9]+$/.test(s)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' })
    }

    if (!requireAdminKey(req)) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    await dbConnect(process.env.MONGODB_URI!)

    const captureId = (req.query.captureId as string) || ''
    const orderId = (req.query.orderId as string) || ''

    if (!captureId && !orderId) {
      return res.status(400).json({ error: 'missing_capture_or_order_id' })
    }

    // Locate order by captureId or orderId
    const query: any = captureId
      ? { captureIds: captureId }
      : { orderId: orderId }
    const order = await Order.findOne(query).lean<OrderDoc>()
    if (!order) return res.status(404).json({ error: 'order_not_found' })

    // Already refunded?
    if (order.status === 'refunded') {
      return res.status(409).json({ error: 'already_refunded' })
    }

    // Test mode shortcut
    const testMode = String(process. PAYPAL_CLIENT_SECRET_REDACTED?? '').trim() === '1'
    let refundResponse: any = { mocked: true }
    if (!testMode) {
      const targetCapture =
        captureId || (order.captureIds && order.captureIds[0]) || ''
      if (!targetCapture) {
        return res.status(400).json({ error: 'no_capture_id_on_order' })
      }
      refundResponse = await refundCapture(targetCapture)
    }

    // Restock: add back purchased qty
    const results: Array<{ id: string; matched: number; modified: number }> = []
    for (const it of order.items || []) {
      const id = String(it.id)
      const qty = Number(it.qty || 0)
      if (qty <= 0) continue

      let matched = 0
      let modified = 0
      if (looksNumericId(id)) {
        const r = await Product.updateOne(
          { inventoryId: Number(id) },
          { $inc: { qty } }
        )
        matched = r.matchedCount ?? (r as any).n ?? 0
        modified = r.modifiedCount ?? (r as any).nModified ?? 0
      } else {
        const r = await Product.updateOne({ _id: id }, { $inc: { qty } })
        matched = r.matchedCount ?? (r as any).n ?? 0
        modified = r.modifiedCount ?? (r as any).nModified ?? 0
      }
      results.push({ id, matched, modified })
    }

    // Mark order refunded
    await Order.updateOne(
      { _id: order._id },
      {
        $set: { status: 'refunded' },
        $push: {
          refunds: {
            captureId: captureId || (order.captureIds && order.captureIds[0]),
            orderId: order.orderId,
            at: new Date(),
            amount: order.totals?.grandTotal,
          },
        },
      }
    )

    return res.status(200).json({
      ok: true,
      refunded: !testMode,
      testMode,
      orderId: order.orderId,
      captureIds: order.captureIds ?? [],
      restockResults: results,
      refundResponse,
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'refund_restock_failed', message: err?.message })
  }
}