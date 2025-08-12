import type { NextApiRequest, NextApiResponse } from 'next'

function baseFor(env: string | undefined) {
  const live = (env || '').toLowerCase() === 'live'
  return {
    api: live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
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
    const orderId = String(req.query.orderId || '')
    if (!orderId) return res.status(400).json({ error: 'missing_order_id' })

    const { api } = baseFor(process.env.PAYPAL_ENV)
    const token = await getAccessToken()

    const cap = await fetch(`${api}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const text = await cap.text()
    if (!cap.ok) {
      return res.status(cap.status).json({ error: 'paypal_capture_failed', message: text })
    }

    // Optionally parse to JSON
    let data: any
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    return res.status(200).json({ ok: true, orderId, capture: data })
  } catch (err: any) {
    return res.status(500).json({ error: 'fatal', message: err?.message || String(err) })
  }
}