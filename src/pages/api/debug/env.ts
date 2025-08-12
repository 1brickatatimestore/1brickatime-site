import type { NextApiRequest, NextApiResponse } from 'next'

function mask(v?: string, keep = 4) {
  if (!v) return null
  if (v.length <= keep) return v
  return v.slice(0, keep) + '…'
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const siteUrl = process. PAYPAL_CLIENT_SECRET_REDACTED|| null
    const currency = process.env.CURRENCY || 'AUD'

    const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const stripeSec = process.env.STRIPE_SECRET_KEY

    const paypalEnv = (process.env.PAYPAL_ENV || 'live').toLowerCase()
    const paypalId  = process.env.PAYPAL_CLIENT_ID

    // very light parse of Mongo connection to show only driver/host
    const mongo = process.env.MONGODB_URI || ''
    let driver = null, host = null
    if (mongo) {
      try {
        const afterScheme = mongo.split('://')[1] || ''
        const parts = afterScheme.split('@')
        const right = parts.length > 1 ? parts[1] : parts[0]
        host = right.split('/')[0] || null
        driver = mongo.split('://')[0] || 'mongodb'
      } catch { /* noop */ }
    }

    res.setHeader('Content-Type', 'application/json')
    res.status(200).json({
      ok: true,
      nodeEnv: process.env.NODE_ENV || 'development',
      siteUrl,
      currency,
      stripe: {
        publishablePresent: !!stripePub,
        secretPresent: !!stripeSec,
        publishableMasked: stripePub ? mask(stripePub, 5) : null,
      },
      paypal: {
        env: paypalEnv,
        clientPresent: !!paypalId,
        clientMasked: paypalId ? mask(paypalId, 4) : null,
      },
      db: {
        driver,
        host,
        present: !!mongo,
      },
    })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) })
  }
}