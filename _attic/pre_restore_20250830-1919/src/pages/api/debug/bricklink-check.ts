// src/pages/api/debug/bricklink-check.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

const BL_BASE = 'https://api.bricklink.com/api/store/v1'

const {
  BRICKLINK_CONSUMER_KEY,
  BRICKLINK_CONSUMER_SECRET,
  BRICKLINK_TOKEN_VALUE,
  BRICKLINK_TOKEN_SECRET,
} = process.env

const oauth = new OAuth({
  consumer: {
    key: BRICKLINK_CONSUMER_KEY || '',
    secret: BRICKLINK_CONSUMER_SECRET || '',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

function authHeaders(url: string) {
  const token = {
    key: BRICKLINK_TOKEN_VALUE || '',
    secret: BRICKLINK_TOKEN_SECRET || '',
  }
  return oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 5))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const debug = String(req.query.debug || '') === '1'

  const url = `${BL_BASE}/inventories?limit=${limit}&offset=${offset}` // ✅ correct endpoint

  try {
    const headers = { ...authHeaders(url), 'Content-Type': 'application/json' }
    const r = await fetch(url, { headers, cache: 'no-store' })
    const text = await r.text()

    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      return res.status(200).json({
        ok: false,
        error: `Non-JSON from BrickLink (${r.status})`,
        debug: { url, sample: text.slice(0, 300) },
      })
    }

    const code = json?.meta?.code ?? r.status
    if (code >= 400 || !r.ok) {
      return res.status(200).json({
        ok: false,
        error: `BrickLink ${code}: ${json?.meta?.description || json?.meta?.message || 'Error'}`,
        debug: debug ? { url, meta: json?.meta } : undefined,
      })
    }

    const data: any[] = Array.isArray(json?.data) ? json.data : []
    return res.status(200).json({
      ok: true,
      count: data.length,
      called: url,
      preview: data.slice(0, limit),
    })
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err?.message || String(err), debug: debug ? { url } : undefined })
  }
}