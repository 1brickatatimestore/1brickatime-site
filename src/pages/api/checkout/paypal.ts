// src/pages/api/checkout/paypal.ts
import type { NextApiRequest, NextApiResponse } from 'next'
<<<<<<< HEAD

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
=======
import * as paypal from '@paypal/checkout-server-sdk'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
  const envName = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()

  const environment =
    envName === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret)

  return new paypal.core.PayPalHttpClient(environment)
}

type Item = {
  sku: string
  name: string
  price: number     // AUD dollars
  quantity: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const items: Item[] = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'No items' })

    const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const client = paypalClient()

    const request = new paypal.orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'AUD',
            value: value.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'AUD',
                value: value.toFixed(2),
              },
            },
          },
          items: items.map(i => ({
            name: i.name || i.sku,
            sku: i.sku,
            unit_amount: { currency_code: 'AUD', value: i.price.toFixed(2) },
            quantity: String(i.quantity || 1),
          })),
        },
      ],
      application_context: {
        brand_name: '1 Brick at a Time',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/checkout?status=paypal_success`,
        cancel_url: `${siteUrl}/checkout?status=paypal_cancel`,
      },
    })

    const order = await client.execute(request)
    const approveUrl =
      order?.result?.links?.find((l: any) => l.rel === 'approve')?.href || null

    if (!approveUrl) return res.status(500).json({ error: 'No approval URL returned' })

    return res.status(200).json({ approveUrl })
  } catch (err: any) {
    console.error('PayPal order create error:', err)
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
    return res.status(500).json({ error: err?.message || 'PayPal error' })
  }
}