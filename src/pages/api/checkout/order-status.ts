import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) throw new Error('MONGODB_URI missing')

const OrderSchema = new mongoose.Schema(
  { orderId: { type: String, index: true }, amount: Object, createdAt: Date },
  { collection: 'orders' }
)
const Order =
  (mongoose.models.Order as mongoose.Model<any>) ||
  mongoose.model('Order', OrderSchema)

async function db() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await db()
    const orderId = (req.query.orderId as string) || ''
    if (!orderId) return res.status(400).json({ error: 'missing_orderId' })
    const row = await Order.findOne({ orderId }).lean()
    if (!row) return res.status(404).json({ status: 'unknown' })
    res.status(200).json({ status: 'paid', totals: row.amount, createdAt: row.createdAt })
  } catch (e: any) {
    res.status(500).json({ error: 'order_status_failed', message: String(e?.message || e) })
  }
}