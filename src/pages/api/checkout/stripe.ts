// src/pages/api/checkout/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const secret = process. PAYPAL_CLIENT_SECRET_REDACTED|| '';
const stripe = new Stripe(secret, { apiVersion: '2024-06-20' as any });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!secret) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

  const { items, success_url, cancel_url } = req.body as {
    items: { name?: string; itemNo?: string; price: number; qty?: number }[];
    success_url?: string; cancel_url?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items' });
  }

  const line_items = items.map((i) => ({
    quantity: i.qty || 1,
    price_data: {
      currency: 'aud',
      product_data: { name: i.name || i.itemNo || 'Minifig' },
      unit_amount: Math.round(Number(i.price) * 100),
    },
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    success_url: success_url || `${req.headers.origin}/checkout?status=success`,
    cancel_url: cancel_url || `${req.headers.origin}/checkout?status=cancel`,
  });

  return res.status(200).json({ url: session.url });
}