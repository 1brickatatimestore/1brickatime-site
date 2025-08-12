// src/pages/api/checkout/paypal-create.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const API_BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_SECRET || '';
  const token = Buffer.from(`${id}:${secret}`).toString('base64');
  const r = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  return d.access_token as string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { amount } = req.body as { amount: number };
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const access = await getAccessToken();
  const orderRes = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'AUD', value: amount.toFixed(2) } }],
    }),
  });
  const order = await orderRes.json();
  if (!order.id) return res.status(500).json({ error: 'Failed to create order' });
  res.status(200).json({ id: order.id });
}