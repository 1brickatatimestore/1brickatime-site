import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

type Item = { id: string; name: string; qty: number; price: number; imageUrl?: string }
type Postage = { id: string; label: string; price: number }

const STRIPE_SECRET_KEY = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
const SITE_URL = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'
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
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe session error:', err)
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
  }
}