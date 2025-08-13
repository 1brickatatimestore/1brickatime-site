import type { NextApiRequest, NextApiResponse } from 'next'

const isTestMode = () => (process.env.CHECKOUT_TEST_MODE ?? '') === '1'
const PP_BASE = 'https://api-m.paypal.com'

const siteUrlFrom = (req: NextApiRequest) =>
  process.env.NEXT_PUBLIC_SITE_URL || `http://${req.headers.host}`

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID || ''
  const secret = process.env.PAYPAL_CLIENT_SECRET || ''
  const auth = Buffer.from(`${id}:${secret}`).toString('base64')

  const r = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error_description || 'paypal_token_failed')
  return j.access_token as string
}

async function capture(orderId: string) {
  const token = await getAccessToken()
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  const j = await r.json()
  if (!r.ok) {
    const err = new Error('paypal_capture_failed') as any
    err.details = j
    throw err
  }
  return j
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const siteUrl = siteUrlFrom(req)
  try {
    const orderId =
      (req.query.token as string) ||
      (req.query.orderID as string) ||
      (req.query.orderId as string)

    if (!orderId) {
      return res.redirect(302, `${siteUrl}/checkout?error=missing_order_id`)
    }

    if (isTestMode()) {
      const u = new URL(`${siteUrl}/thank-you`)
      u.searchParams.set('provider', 'paypal')
      u.searchParams.set('orderId', orderId)
      u.searchParams.set('status', 'success')
      u.searchParams.set('test', '1')
      return res.redirect(302, u.toString())
    }

    await capture(orderId)

    const u = new URL(`${siteUrl}/thank-you`)
    u.searchParams.set('provider', 'paypal')
    u.searchParams.set('orderId', orderId)
    u.searchParams.set('status', 'success')
    return res.redirect(302, u.toString())
  } catch (e: any) {
    console.error('paypal-return error', e?.details || e)
    return res.redirect(302, `${siteUrl}/checkout?error=paypal_capture_failed`)
  }
}