// src/lib/paypal.ts
type Env = 'sandbox' | 'live'

const ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
const BASE =
  ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

const CLIENT = process.env.PAYPAL_CLIENT_ID || ''
const SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
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

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`PayPal OAuth failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as { access_token: string }
    return json.access_token
  },
}