import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'
import { sendOrderEmail } from '@/lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const orderId = (req.query.orderId as string) || ''
  if (!orderId) return res.status(422).json({ error: 'missing_orderId' })

  await dbConnect(process.env.MONGODB_URI!)
  const cx = (mongoose.connection as any).db

  const order = await cx.collection('orders').findOne({ orderId })
  if (!order) return res.status(404).json({ error: 'order_not_found' })

  const rsp = await sendOrderEmail({
    _id: String(order._id),
    orderId: order.orderId,
    captureId: order.captureId,
    payer: order.payer,
    totals: order.totals,
    items: order.items,
    createdAt: order.createdAt,
  })

  return res.status(200).json(rsp)
}