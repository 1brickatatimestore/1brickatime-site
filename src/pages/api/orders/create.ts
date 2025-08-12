// src/pages/api/orders/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const { items, email, name, notes, paymentMethod } = req.body || {}
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ ok: false, error: 'No items' })
    }
    const subtotal = items.reduce((sum: number, it: any) => {
      const p = typeof it.price === 'number' ? it.price : 0
      const q = typeof it.qty === 'number' ? it.qty : 1
      return sum + p * q
    }, 0)

    const order = await Order.create({
      items,
      subtotal,
      paymentMethod: paymentMethod === 'bank_deposit' ? 'bank_deposit' : 'bank_deposit',
      email: email || null,
      name: name || null,
      notes: notes || null,
      status: 'pending',
    })

    return res.status(200).json({ ok: true, orderId: order._id.toString(), subtotal })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ ok: false, error: e.message || 'Server error' })
  }
}