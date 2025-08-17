// src/pages/api/checkout/stripe-session.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripeSecret = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''

type Item = { id: string; name: string; price: number; qty: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()
    if (!stripeSecret) return res.status(500).json({ error: 'STRIPE_SECRET_KEY missing' })

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
    const items: Item[] = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Cart empty' })

    const currency = (process. PAYPAL_CLIENT_SECRET_REDACTED|| 'AUD').toLowerCase()
    const line_items = items.map(it => ({
      quantity: it.qty,
      price_data: {
        currency,
        unit_amount: Math.round(it.price * 100),
        product_data: { name: it.name },
      },
    }))

    const base = process. PAYPAL_CLIENT_SECRET_REDACTED|| `http://${req.headers.host}`
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout?canceled=1`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Stripe error' })
  }
}