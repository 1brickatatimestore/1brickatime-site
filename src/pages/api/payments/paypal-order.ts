// src/pages/api/payments/paypal-order.ts
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!client || !secret) throw new Error('PayPal not configured')

  const auth = Buffer.from(`${client}:${secret}`).toString('base64')
  const r = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const j = await r.json()
  if (!j.access_token) throw new Error('PayPal auth failed')
  return j.access_token as string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { items } = req.body || {}
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ ok: false, error: 'No items' })

  const total = items.reduce((s: number, it: any) => s + (Number(it.price) || 0) * (it.qty || 1), 0)
  const access = await getAccessToken()

  const create = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: total.toFixed(2) },
        },
      ],
    }),
  })
  const order = await create.json()
  res.status(200).json({ ok: true, id: order.id, approveLink: order.links?.find((l: any) => l.rel === 'approve')?.href })
}