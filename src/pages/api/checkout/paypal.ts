// src/pages/api/checkout/paypal.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const CLIENT = process.env.PAYPAL_CLIENT_ID || ''
const SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
const ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox'
const BASE = ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

type Item = { id: string; name: string; price: number; qty: number }

async function token() {
  const auth = Buffer.from(`${CLIENT}:${SECRET}`).toString('base64')
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  if (!r.ok) throw new Error('PayPal auth failed')
  const j = await r.json()
  return j.access_token as string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()
    if (!CLIENT || !SECRET) return res.status(500).json({ error: 'PayPal env missing' })

    const items: Item[] = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Cart empty' })

    const currency = (process. PAYPAL_CLIENT_SECRET_REDACTED|| 'AUD').toUpperCase()
    const value = items.reduce((s, it) => s + it.price * it.qty, 0)
    const access = await token()

    const base = process. PAYPAL_CLIENT_SECRET_REDACTED|| `http://${req.headers.host}`

    const create = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: value.toFixed(2),
              breakdown: { item_total: { currency_code: currency, value: value.toFixed(2) } }
            }
          }
        ],
        application_context: {
          brand_name: process. PAYPAL_CLIENT_SECRET_REDACTED|| '1 Brick at a Time',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${base}/thank-you?pp=1`,
          cancel_url: `${base}/checkout?canceled=1`
        }
      })
    })

    const j = await create.json()
    if (!create.ok) {
      return res.status(500).json({ error: j?.message || 'PayPal create error' })
    }

    const approve = (j?.links || []).find((l: any) => l.rel === 'approve')?.href
    if (!approve) return res.status(500).json({ error: 'Approve link not found' })

    return res.status(200).json({ approveUrl: approve })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'PayPal error' })
  }
}