import type { NextApiRequest, NextApiResponse } from 'next';
import { getCart } from '@/lib/cart';
import { createCheckoutSession } from '@/lib/stripe-session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const cart = getCart(req.body);
    const session = await createCheckoutSession(cart);

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}