import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose, { Schema, model, models } from 'mongoose'

const OrderSchema = new Schema({
  orderId: String,
  captureId: String,
  status: String,
  currency: String,
  totals: {
    items: Number,
    shipping: Number,
    total: Number,
  },
  payer: {
    name: String,
    email: String,
  },
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)
    const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 25)))
    const docs = await Order.find({}).sort({ createdAt: -1 }).limit(limit).lean()

    // optional compact view
    if (String(req.query.compact || '') === '1') {
      const flat = docs.map(d => ({
        orderId: d.orderId,
        captureId: d.captureId,
        status: d.status,
        total: d.totals?.total,
        currency: d.currency,
        createdAt: d.createdAt,
      }))
      return res.json(flat)
    }
    res.json(docs)
  } catch (err:any) {
    res.status(500).json({ error: 'orders_list_failed', message: err.message })
  }
}