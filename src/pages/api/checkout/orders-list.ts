import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) throw new Error('MONGODB_URI missing')

const OrderSchema = new mongoose.Schema(
  {
    provider: String,
    orderId: { type: String, index: true },
    captureIds: [String],
    payer: Object,
    amount: Object,
    items: Array,
    createdAt: { type: Date, default: Date.now },
  },
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
    const limit = Math.min(Number(req.query.limit || 50), 200)
    const q = (req.query.q as string) || ''
    const query: any = {}
    if (q) {
      query.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { 'payer.email': { $regex: q, $options: 'i' } },
        { captureIds: { $elemMatch: { $regex: q, $options: 'i' } } },
      ]
    }
    const rows = await Order.find(query).sort({ createdAt: -1 }).limit(limit).lean()
    res.status(200).json(rows)
  } catch (e: any) {
    res.status(500).json({ error: 'orders_list_failed', message: String(e?.message || e) })
  }
}