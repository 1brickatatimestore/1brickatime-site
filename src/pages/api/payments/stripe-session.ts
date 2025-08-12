// src/pages/api/payments/stripe-session.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return res.status(400).json({ ok: false, error: 'Stripe not configured' })

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(key, { apiVersion: '2024-06-20' })

  const { items } = req.body || {}
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ ok: false, error: 'No items' })

  const line_items = items.map((it: any) => ({
    quantity: it.qty || 1,
    price_data: {
      currency: 'usd',
      unit_amount: Math.max(50, Math.round((it.price || 0) * 100)), // min 50¢
      product_data: {
        name: it.name || it.itemNo || 'Minifig',
        images: it.imageUrl ? [it.imageUrl] : [],
        metadata: { inventoryId: String(it.inventoryId ?? '') },
      },
    },
  }))

  const origin = req.headers.origin || `http://${req.headers.host}`
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: `${origin}/cart?paid=1`,
    cancel_url: `${origin}/cart?canceled=1`,
  })

  res.status(200).json({ ok: true, url: session.url })
}