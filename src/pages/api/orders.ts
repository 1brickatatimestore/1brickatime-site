// src/pages/api/orders.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Order from '../../models/Order'

type Item = {
  inventoryId: number
  itemNo?: string | null
  name?: string | null
  imageUrl?: string | null
  price: number
  qty: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    if (req.method === 'POST') {
      const { method, items, contact } = req.body as {
        method: 'BANK' | 'PAYPAL' | 'STRIPE'
        items: Item[]
        contact?: { email?: string; name?: string; notes?: string }
      }

      if (!method || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ ok: false, error: 'Missing method or items' })
      }

      // sanitize and compute
      const clean: Item[] = items
        .filter(i => i && i.inventoryId && i.price != null && i.qty && i.qty > 0)
        .map(i => ({
          inventoryId: Number(i.inventoryId),
          itemNo: i.itemNo ?? null,
          name: i.name ?? null,
          imageUrl: i.imageUrl ?? null,
          price: Number(i.price),
          qty: Number(i.qty),
        }))

      if (clean.length === 0) {
        return res.status(400).json({ ok: false, error: 'No valid items' })
      }

      const subtotal = clean.reduce((sum, i) => sum + i.price * i.qty, 0)

      const order = await Order.create({
        method,
        items: clean,
        subtotal,
        status: 'PENDING',
        contact: {
          email: contact?.email ?? null,
          name: contact?.name ?? null,
          notes: contact?.notes ?? null,
        },
      })

      return res.status(200).json({ ok: true, orderId: order._id.toString(), subtotal })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err: any) {
    console.error('orders api error:', err)
    return res.status(500).json({ ok: false, error: err.message || 'Server error' })
  }
}