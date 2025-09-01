// src/pages/api/checkout/paypal-capture.ts
import type { NextApiRequest, NextApiResponse } from 'next';

function getPaypalBase() {
  const env = (process.env.PAYPAL_ENV || 'live').toLowerCase();
  const base = env === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  return { api: base, oauth: `${base}/v1/oauth2/token` };
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!client || !secret) throw new Error('Missing PayPal credentials');
  const { oauth } = getPaypalBase();

  const res = await fetch(oauth, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal OAuth failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('PayPal OAuth: no access_token');
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const orderId = (req.query.orderId as string) || (req.body?.orderId as string);
    if (!orderId) return res.status(400).json({ error: 'missing_orderId' });

    const access = await getAccessToken();
    const { api } = getPaypalBase();

    const capRes = await fetch(`${api}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `cap-${Date.now()}`, // idempotency
      },
    });

    const json = await capRes.json().catch(() => ({}));
    if (!capRes.ok) {
      return res.status(500).json({
        error: 'paypal_capture_failed',
        status: capRes.status,
        details: json,
      });
    }

    return res.status(200).json({ ok: true, orderId, result: json });
  } catch (err: any) {
    console.error('paypal-capture error:', err?.message || err);
    return res.status(500).json({ error: 'fatal', message: err?.message || 'Unknown error' });
  }
}
