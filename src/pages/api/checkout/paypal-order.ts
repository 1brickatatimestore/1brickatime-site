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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!resp.ok) {
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
  } catch (err: any) {
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
  }
}