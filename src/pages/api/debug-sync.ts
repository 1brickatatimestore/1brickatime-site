import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = process.env.BL_USER_ID!
  const url    = `https://api.bricklink.com/api/store/v1/inventories?user_id=${encodeURIComponent(userId)}&offset=0&limit=1`

  const oauth = OAuth({
    consumer: { key: process.env.BL_KEY!, secret: process.env.BL_SECRET! },
    signature_method: 'HMAC-SHA1',
    hash_function(base: string, key: string) {
      return crypto.createHmac('sha1', key).update(base).digest('base64')
    },
  })
  const token   = { key: process.env.BL_TOKEN!, secret: process.env.BL_TOKEN_SECRET! }
  const headers = {
    ...oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token)),
    Accept: 'application/json',
  }

  try {
    const { data } = await axios.get<{ data: any[]; meta: any }>(url, { headers })
    return res.status(200).json({
      ok:     true,
      url,
      headers,
      meta:   data.meta,
      item:   data.data[0] || null,
    })
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({
      ok:    false,
      error: err.response?.data || err.message,
    })
  }
}