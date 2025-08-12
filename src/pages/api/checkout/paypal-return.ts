// src/pages/api/checkout/paypal-return.ts
import type { NextApiRequest, NextApiResponse } from 'next'

function getSiteUrl(req: NextApiRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return envUrl.replace(/\/+$/, '')
  const proto =
    (req.headers['x-forwarded-proto'] as string) ||
    (req.headers['x-forwarded-protocol'] as string) ||
    'http'
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || 'localhost:3000'
  return `${proto}://${host}`.replace(/\/+$/, '')
}

function getPaypalBase() {
  const env = (process.env.PAYPAL_ENV || 'live').toLowerCase()
  const base = env === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  return { api: base, oauth: `${base}/v1/oauth2/token` }
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!client || !secret) throw new Error('Missing PayPal credentials')
  const { oauth } = getPaypalBase()

  const res = await fetch(oauth, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PayPal OAuth failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('PayPal OAuth: no access_token')
  return data.access_token
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed')

  const site = getSiteUrl(req)
  try {
    // PayPal sends ?token=EC-... which is the order id for v2/checkout/orders
    const orderId =
      (req.query.token as string) ||
      (req.query.orderId as string) ||
      ''

    if (!orderId) {
      return res.redirect(
        302,
        `${site}/checkout?error=missing_order_id`
      )
    }

    const access = await getAccessToken()
    const { api } = getPaypalBase()

    // Capture immediately on return
    const capRes = await fetch(`${api}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `cap-${Date.now()}`,
      },
    })

    const json = await capRes.json().catch(() => ({}))
    if (!capRes.ok) {
      // Send them back to checkout with an error + order id so you can retry
      return res.redirect(
        302,
        `${site}/checkout?error=paypal_capture_failed&orderId=${encodeURIComponent(orderId)}`
      )
    }

    // Success → Thank you page
    return res.redirect(
      302,
      `${site}/thank-you?provider=paypal&orderId=${encodeURIComponent(orderId)}`
    )
  } catch (err: any) {
    console.error('paypal-return error:', err?.message || err)
    return res.redirect(302, `${site}/checkout?error=paypal_return_fatal`)
  }
}