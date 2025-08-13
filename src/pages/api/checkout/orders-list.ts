// src/pages/api/checkout/orders-list.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { Schema, model, models } from 'mongoose'
import dbConnect from '@/lib/dbConnect'

// Minimal Order model (works even if you already have one)
type OrderItem = {
  id: string            // inventoryId as string OR Mongo _id
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type OrderDoc = {
  _id: any
  provider: 'paypal' | 'stripe' | 'bank'
  orderId?: string      // PayPal order id
  captureIds?: string[] // PayPal capture ids
  status: string        // created | approved | captured | refunded | failed
  payerEmail?: string
  items: OrderItem[]
  totals?: {
    itemsTotal: number
    postage?: number
    grandTotal: number
    currency?: string
  }
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
      raw: Schema.Types.Mixed,
    },
    { timestamps: true }
  )

const Order = models.Order || model<OrderDoc>('Order', OrderSchema)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 20)))
    const compact = String(req.query.compact ?? '').toLowerCase() === '1' ||
                    String(req.query.compact ?? '').toLowerCase() === 'true'

    const docs = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    if (compact) {
      const simplified = docs.map((o) => ({
        _id: String(o._id),
        provider: o.provider,
        orderId: o.orderId,
        captureIds: o.captureIds ?? [],
        status: o.status,
        payerEmail: o.payerEmail,
        grandTotal: o.totals?.grandTotal,
        currency: o.totals?.currency,
        itemsCount: o.items?.reduce((n, it) => n + (Number(it.qty) || 0), 0) ?? 0,
        createdAt: o.createdAt,
      }))
      return res.status(200).json(simplified)
    }

    return res.status(200).json(docs)
  } catch (err: any) {
    return res.status(500).json({ error: 'orders_list_failed', message: err?.message })
  }
}