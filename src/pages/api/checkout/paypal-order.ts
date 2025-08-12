import type { NextApiRequest, NextApiResponse } from 'next'

type Item = { id: string; name: string; qty: number; price: number; imageUrl?: string }
type Postage = { id: string; label: string; price: number }

function baseFor(env: string | undefined) {
  const live = (env || '').toLowerCase() === 'live'
  return {
    api: live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    web: live ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com',
  }
}

async function getAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV } = process.env
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal client not configured')
  }
  const { api } = baseFor(PAYPAL_ENV)

  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  const resp = await fetch(`${api}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`PayPal OAuth failed (${resp.status}): ${text}`)
  }
  const json = await resp.json() as { access_token: string }
  return json.access_token
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  try {
    const { items, postage }: { items: Item[]; postage?: Postage } = req.body || {}
    const currency = (process.env.CURRENCY || 'AUD').toUpperCase()
    const site = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'
    const brand = process. PAYPAL_CLIENT_SECRET_REDACTED|| '1 Brick at a Time'
    const { api } = baseFor(process.env.PAYPAL_ENV)

    const safeItems = Array.isArray(items) ? items : []
    const subtotal = safeItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0)
    const ship = postage ? Number(postage.price) || 0 : 0
    const total = +(subtotal + ship).toFixed(2)

    const accessToken = await getAccessToken()

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: currency, value: subtotal.toFixed(2) },
              shipping: { currency_code: currency, value: ship.toFixed(2) },
            },
          },
          items: safeItems.map((it) => ({
            name: it.name?.slice(0, 120) || 'Minifig',
            quantity: String(it.qty || 1),
            unit_amount: {
              currency_code: currency,
              value: (Number(it.price) || 0).toFixed(2),
            },
          })),
        },
      ],
      application_context: {
        brand_name: brand,
        user_action: 'PAY_NOW',
        return_url: `${site}/api/checkout/paypal-return`,
        cancel_url: `${site}/checkout`,
      },
    }

    const create = await fetch(`${api}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    })
    if (!create.ok) {
      const text = await create.text()
      return res.status(create.status).json({ error: 'paypal_create_failed', message: text })
    }
    const data = await create.json() as any
    const approve = (data.links || []).find((l: any) => l.rel === 'approve')?.href
    return res.status(200).json({ id: data.id, approve })
  } catch (err: any) {
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
  }
}