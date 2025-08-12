// src/lib/paypal.ts
type Env = 'sandbox' | 'live'

const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() as Env
const BASE = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
const CURRENCY = (process.env.CURRENCY || 'AUD').toUpperCase()

if (!CLIENT_ID || !CLIENT_SECRET) {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-console
  console.warn('[paypal] Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET')
}

export const paypal = {
  env,
  base: BASE,
  currency: CURRENCY,

  async token(): Promise<string> {
    const url = `${BASE}/v1/oauth2/token`
    const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`PayPal OAuth failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as { access_token: string }
    return json.access_token
  },
}