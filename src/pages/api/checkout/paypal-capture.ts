// src/pages/api/checkout/paypal-capture.ts
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
  const { orderId } = req.body as { orderId: string };
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  const access = await getAccessToken();
  const capRes = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
  });
  const cap = await capRes.json();
  if (cap.status === 'COMPLETED') return res.status(200).json({ ok: true });
  res.status(500).json({ error: 'Capture failed', details: cap });
}