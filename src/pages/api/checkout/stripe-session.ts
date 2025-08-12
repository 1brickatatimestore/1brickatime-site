<<<<<<< HEAD
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
=======
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

type Item = { id: string; name: string; qty: number; price: number; imageUrl?: string }
type Postage = { id: string; label: string; price: number }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const CURRENCY = (process.env.CURRENCY || 'AUD').toLowerCase()

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' })

    const body = (req.body || {}) as { items: Item[]; postage?: Postage }
    const items: Item[] = Array.isArray(body.items) ? body.items : []
    const postage: Postage | undefined = body.postage

    if (!items.length) return res.status(400).json({ error: 'No items' })

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(i => ({
      quantity: i.qty || 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: Math.round((i.price || 0) * 100),
        product_data: {
          name: i.name || 'Item',
          images: i.imageUrl ? [i.imageUrl] : [],
          metadata: { id: i.id },
        },
      },
    }))

    if (postage && postage.price >= 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: Math.round(postage.price * 100),
          product_data: { name: postage.label || 'Postage' },
        },
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${SITE_URL}/thank-you?provider=stripe&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/thank-you?provider=stripe&status=cancelled`,
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
<<<<<<< HEAD
    return res.status(500).json({ error: err?.message || 'Stripe error' })
=======
    console.error('Stripe session error:', err)
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
  }
}