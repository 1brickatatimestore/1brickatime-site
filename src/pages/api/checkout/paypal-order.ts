<<<<<<< HEAD
// src/pages/api/checkout/paypal-order.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type Item = { id: string; name: string; qty: number; price: number }
type Postage = { id: string; label: string; price: number }

const CURRENCY = process.env.CURRENCY || 'AUD'
const SITE_URL = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase() // 'live' or 'sandbox'
const PP_BASE =
  PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

function toMoney(n: number) {
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0
}
function moneyStr(n: number) {
  return toMoney(n).toFixed(2)
}

async function getAccessToken() {
  const cid = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!cid || !secret) throw new Error('PayPal credentials missing')

  const resp = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${cid}:${secret}`).toString('base64'),
=======
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
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!resp.ok) {
<<<<<<< HEAD
    const text = await resp.text().catch(() => '')
    throw new Error(`PayPal OAuth failed (${resp.status}): ${text}`)
  }
  const json = await resp.json()
  return json.access_token as string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const { items = [], postage }: { items: Item[]; postage?: Postage } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'no_items' })
    }

    // Sanitize items
    const safeItems = items.map((i) => ({
      id: String(i.id || ''),
      name: String(i.name || 'Item'),
      qty: Math.max(1, Number(i.qty || 1)),
      price: toMoney(Number(i.price || 0)),
    }))

    const itemTotal = toMoney(
      safeItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    )
    const ship = postage ? toMoney(Number(postage.price || 0)) : 0
    const orderTotal = toMoney(itemTotal + ship)

    const accessToken = await getAccessToken()

    // Build PayPal purchase unit
    const purchaseUnit: any = {
      amount: {
        currency_code: CURRENCY,
        value: moneyStr(orderTotal),
        breakdown: {
          item_total: { currency_code: CURRENCY, value: moneyStr(itemTotal) },
          shipping: { currency_code: CURRENCY, value: moneyStr(ship) },
        },
      },
      items: safeItems.map((i) => ({
        name: i.name.slice(0, 127),
        quantity: String(i.qty),
        unit_amount: { currency_code: CURRENCY, value: moneyStr(i.price) },
      })),
    }

    // If postage is provided, include a selectable shipping option and mark it selected
    if (postage) {
      purchaseUnit.shipping = {
        options: [
          {
            id: String(postage.id || 'postage'),
            label: String(postage.label || 'Shipping'),
            type: 'SHIPPING',
            selected: true, // ← important to avoid SHIPPING_OPTION_NOT_SELECTED
            amount: { currency_code: CURRENCY, value: moneyStr(ship) },
          },
        ],
      }
    }

    const body = {
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: '1 Brick at a Time',
        user_action: 'PAY_NOW',
        return_url: `${SITE_URL}/api/checkout/paypal-return`,
        cancel_url: `${SITE_URL}/checkout?canceled=1`,
      },
    }

    const create = await fetch(`${PP_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `ord_${Date.now()}`, // idempotency
      },
      body: JSON.stringify(body),
    })

    const j = await create.json()
    if (!create.ok) {
      return res.status(create.status).json({
        error: 'paypal_order_failed',
        status: create.status,
        details: j,
      })
    }

    const approve = Array.isArray(j.links)
      ? j.links.find((l: any) => l.rel === 'approve')?.href
      : undefined

    if (!approve) {
      return res.status(502).json({ error: 'missing_approve_url', order: j })
    }

    return res.status(200).json({ id: j.id, approve })
=======
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
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const brand = process.env.PAYPAL_BRAND_NAME || '1 Brick at a Time'
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
>>>>>>> 68577e0 (Lock: header/footer layout + home styles + Minifigs grid)
  } catch (err: any) {
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
  }
}