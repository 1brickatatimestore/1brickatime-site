// src/lib/paypal.ts
import type { NextApiRequest } from 'next'

type Money = { currency_code: string; value: string }
type ItemIn = { id: string; name: string; qty: number; price: number }
type PostageIn = { id: string; label: string; price: number }

const ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
const BASE =
  ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

const CLIENT = process.env.PAYPAL_CLIENT_ID || ''
const SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
const CURRENCY = (process.env.CURRENCY || 'AUD').toUpperCase()

function to2(n: number) {
  // PayPal requires strings with 2dp
  return (Math.round(n * 100) / 100).toFixed(2)
}

async function getAccessToken() {
  if (!CLIENT || !SECRET) {
    throw new Error('PayPal client/secret missing in env')
  }
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${CLIENT}:${SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `PayPal OAuth failed (${res.status}): ${JSON.stringify(json).slice(0, 400)}`
    )
  }
  return json.access_token as string
}

/** Builds a PayPal order payload that balances item_total + shipping == amount.value */
export function buildOrderPayload(opts: {
  items: ItemIn[]
  postage?: PostageIn | null
  reference?: string
  returnUrl: string
  cancelUrl: string
}) {
  const items = opts.items || []
  const postage = opts.postage || null

  const item_total_num = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping_num = postage ? postage.price : 0
  const grand = item_total_num + shipping_num

  const item_lines = items.map((i) => ({
    name: i.name.slice(0, 127),
    quantity: String(i.qty),
    unit_amount: { currency_code: CURRENCY, value: to2(i.price) } as Money,
  }))

  const amount: {
    currency_code: string
    value: string
    breakdown: {
      item_total: Money
      shipping?: Money
    }
  } = {
    currency_code: CURRENCY,
    value: to2(grand),
    breakdown: {
      item_total: { currency_code: CURRENCY, value: to2(item_total_num) },
    },
  }
  if (shipping_num > 0) {
    amount.breakdown.shipping = { currency_code: CURRENCY, value: to2(shipping_num) }
  }

  // v2 Orders payload
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: opts.reference || 'order-1',
        items: item_lines,
        amount,
      },
    ],
    application_context: {
      brand_name: '1 Brick at a Time',
      shipping_preference: 'NO_SHIPPING', // change to "SET_PROVIDED_ADDRESS" if you later send addresses
      user_action: 'PAY_NOW',
      return_url: opts.returnUrl,
      cancel_url: opts.cancelUrl,
    },
  }

  return payload
}

export async function createOrder(args: {
  items: ItemIn[]
  postage?: PostageIn | null
  reference?: string
  returnUrl: string
  cancelUrl: string
}) {
  const access = await getAccessToken()
  const payload = buildOrderPayload(args)

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `PayPal create order failed (${res.status}): ${JSON.stringify(json).slice(0, 600)}`
    )
  }

  const id = json.id as string | undefined
  const approveUrl =
    Array.isArray(json.links) &&
    (json.links.find((l: any) => l.rel === 'approve')?.href as string | undefined)

  if (!id || !approveUrl) {
    throw new Error(
      `PayPal response missing id/approveUrl: ${JSON.stringify(json).slice(0, 600)}`
    )
  }

  return { id, approveUrl }
}

export async function captureOrder(orderId: string) {
  const access = await getAccessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `PayPal capture failed (${res.status}): ${JSON.stringify(json).slice(0, 600)}`
    )
  }
  return json
}

// Helpers for API routes (optional)
export function siteUrlFromEnv() {
  return process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'
}