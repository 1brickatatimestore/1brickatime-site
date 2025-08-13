import type { NextApiRequest, NextApiResponse } from 'next'
import { getAccessToken, baseUrl } from '@/lib/paypal'

type Json = Record<string, any>

function isTestMode() {
  const v = (process.env.CHECKOUT_TEST_MODE || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

function ok(res: NextApiResponse, data: Json) {
  res.status(200).json(data)
}

function bad(res: NextApiResponse, status: number, code: string, message: string, extra?: Json) {
  res.status(status).json({ error: code, message, ...(extra || {}) })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We’ll accept both GET and POST for your convenience when testing from the browser
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return bad(res, 405, 'method_not_allowed', 'Use GET or POST')
  }

  // PayPal returns ?token=... on the return URL; some clients send {orderId} in body.
  const q = req.query || {}
  const body = (typeof req.body === 'object' && req.body) ? req.body : {}
  const orderId =
    (q.orderId as string) ||
    (q.token as string) ||
    (body.orderId as string)

  if (!orderId) {
    return bad(res, 400, 'missing_order_id', 'Provide ?orderId=... (or ?token=...) or JSON {orderId}')
  }

  const currency = (process.env.CURRENCY || 'AUD').toUpperCase()

  // ---------- TEST MODE: no real capture, no charge ----------
  if (isTestMode()) {
    const now = new Date().toISOString()
    // Shape roughly matches PayPal’s capture response so the rest of your flow keeps working.
    const mock: Json = {
      id: orderId,
      status: 'COMPLETED',
      intent: 'CAPTURE',
      create_time: now,
      update_time: now,
      payer: {
        name: { given_name: 'Test', surname: 'Buyer' },
        email_address: 'buyer@example.com',
        payer_id: 'TESTPAYER123',
      },
      purchase_units: [
        {
          reference_id: 'default',
          payments: {
            captures: [
              {
                id: `TEST-CAP-${orderId}`,
                status: 'COMPLETED',
                amount: { currency_code: currency, value: '0.00' },
                final_capture: true,
                create_time: now,
                update_time: now,
              },
            ],
          },
        },
      ],
      _meta: { testMode: true },
    }
    return ok(res, mock)
  }

  // ---------- LIVE CAPTURE ----------
  try {
    const accessToken = await getAccessToken()
    const url = `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`
    const paypalRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `cap_${orderId}`, // idempotency
      },
    })

    const data = await paypalRes.json().catch(() => ({}))

    if (!paypalRes.ok) {
      return bad(res, paypalRes.status, 'paypal_capture_failed', 'PayPal capture failed', {
        details: data,
      })
    }

    return ok(res, data)
  } catch (err: any) {
    return bad(res, 500, 'fatal', err?.message || 'Unexpected error')
  }
}