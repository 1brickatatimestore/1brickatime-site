// src/pages/api/debug/bricklink-inventories.ts
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
  consumer: { key: BRICKLINK_CONSUMER_KEY || '', secret: BRICKLINK_CONSUMER_SECRET || '' },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

function authHeaders(url: string) {
  const token = { key: BRICKLINK_TOKEN_VALUE || '', secret: BRICKLINK_TOKEN_SECRET || '' }
  return oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const url = `${BL_BASE}/inventories?limit=${limit}&offset=${offset}`

  try {
    const r = await fetch(url, { headers: { ...authHeaders(url) }, cache: 'no-store' })
    const text = await r.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      return res.status(200).json({ ok: false, url, error: `Non-JSON (${r.status})`, sample: text.slice(0, 300) })
    }
    return res.status(200).json({ ok: r.ok, url, status: r.status, meta: json?.meta, data: json?.data ?? null })
  } catch (e: any) {
    return res.status(200).json({ ok: false, url, error: e?.message || String(e) })
  }
}