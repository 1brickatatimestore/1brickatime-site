// src/pages/api/debug/bricklink-whoami.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

type WhoAmIResponse = {
  ok: boolean
  whoami?: unknown
  error?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WhoAmIResponse>
) {
  try {
    const {
      BRICKLINK_CONSUMER_KEY,
      BRICKLINK_CONSUMER_SECRET,
      BRICKLINK_TOKEN_VALUE,
      BRICKLINK_TOKEN_SECRET,
    } = process.env

    if (
      !BRICKLINK_CONSUMER_KEY ||
      !BRICKLINK_CONSUMER_SECRET ||
      !BRICKLINK_TOKEN_VALUE ||
      !BRICKLINK_TOKEN_SECRET
    ) {
      res.status(500).json({ ok: false, error: 'Missing BrickLink env vars' })
      return
    }

    const oauth = new OAuth({
      consumer: {
        key: BRICKLINK_CONSUMER_KEY,
        secret: BRICKLINK_CONSUMER_SECRET,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base, key) {
        return crypto.createHmac('sha1', key).update(base).digest('base64')
      },
    })

    const url = 'https://api.bricklink.com/api/store/v1/me'
    const headers = oauth.toHeader(
      oauth.authorize(
        { url, method: 'GET' },
        { key: BRICKLINK_TOKEN_VALUE, secret: BRICKLINK_TOKEN_SECRET }
      )
    )

    const r = await fetch(url, { method: 'GET', headers: { ...headers } })
    const json = await r.json().catch(() => ({}))

    // BrickLink wraps data in { meta, data }
    if (!r.ok || (json?.meta && json.meta.code >= 400)) {
      res.status(400).json({ ok: false, error: json })
      return
    }

    res.status(200).json({ ok: true, whoami: json?.data ?? json })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
}