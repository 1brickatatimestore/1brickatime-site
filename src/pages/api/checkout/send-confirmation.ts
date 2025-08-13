import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose, { Schema, model, models } from 'mongoose'
import { sendOrderEmail } from '@/lib/mailer'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orderId = String(req.query.orderId || '')
    if (!orderId) return res.status(400).json({ error: 'missing_orderId' })
    await dbConnect(process.env.MONGODB_URI!)
    const doc = await Order.findOne({ orderId }).lean()
    if (!doc) return res.status(404).json({ error: 'order_not_found' })
    const sent = await sendOrderEmail(doc)
    res.json({ ok: true, sent })
  } catch (err:any) {
    res.status(500).json({ error: 'send_email_failed', message: err.message })
  }
}