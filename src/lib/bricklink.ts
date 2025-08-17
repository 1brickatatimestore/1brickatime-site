// src/lib/bricklink.ts
import crypto from 'crypto'

type BLKeys = {
  key: string
  secret: string
  token: string
  tokenSecret: string
  userId?: string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export function getBLKeys(): BLKeys {
  return {
    key: process.env.BL_KEY || process.env.BRICKLINK_KEY || requireEnv('BL_KEY'),
    secret: process.env.BL_SECRET || process.env.BRICKLINK_SECRET || requireEnv('BL_SECRET'),
    token: process.env.BL_TOKEN || process.env.BRICKLINK_TOKEN || requireEnv('BL_TOKEN'),
    tokenSecret:
      process.env.BL_TOKEN_SECRET ||
      process. PAYPAL_CLIENT_SECRET_REDACTED||
      requireEnv('BL_TOKEN_SECRET'),
    userId: process.env.BL_USER_ID || process.env.BRICKLINK_USER_ID,
  }
}

/** RFC3986 percent-encode (OAuth requires this, not encodeURIComponent exactly) */
function rfc3986(str: string) {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

/** Build OAuth 1.0a signature (HMAC-SHA1) without external libs */
function buildOAuthSignature(
  method: 'GET' | 'POST',
  url: string,
  allParams: Record<string, any>,
  consumerSecret: string,
  tokenSecret: string
) {
  // 1) Normalize params (key=value), sorted by key then value
  const pairs: string[] = []
  Object.keys(allParams)
    .sort()
    .forEach((k) => {
      const v = allParams[k]
      if (v === undefined || v === null) return
      pairs.push(`${rfc3986(k)}=${rfc3986(String(v))}`)
    })
  const paramString = pairs.join('&')

  // 2) Base string
  const baseString = [method.toUpperCase(), rfc3986(url), rfc3986(paramString)].join('&')

  // 3) Signing key
  const signingKey = `${rfc3986(consumerSecret)}&${rfc3986(tokenSecret)}`

  // 4) HMAC-SHA1 -> base64
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
}

function nonce() {
  return crypto.randomBytes(16).toString('hex')
}

async function blGet(path: string, query: Record<string, any> = {}) {
  const { key, secret, token, tokenSecret } = getBLKeys()
  const baseUrl = 'https://api.bricklink.com/api/store/v1'
  const url = `${baseUrl}${path}`

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: key,
    oauth_token: token,
    oauth_nonce: nonce(),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  }

  const allParams = { ...query, ...oauthParams }
  const signature = buildOAuthSignature('GET', url, allParams, secret, tokenSecret)
  oauthParams.oauth_signature = signature

  const authHeader =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${rfc3986(k)}="${rfc3986(oauthParams[k])}"`)
      .join(', ')

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.append(k, String(v))
  }
  const fullUrl = qs.toString() ? `${url}?${qs.toString()}` : url

  // Next.js runtime already provides fetch (Node 18+)
  const resp = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`BrickLink GET ${path} failed: ${resp.status} ${resp.statusText} ${txt}`)
  }
  return resp.json()
}

/** Basic HTML entity decode for names coming from BL */
export function decodeEntities(s?: string): string {
  if (!s) return ''
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

/** Compute a BrickLink CDN image URL when BL didn’t provide one */
export function computeImageUrl(itemNo?: string, type?: string | null): string | null {
  if (!itemNo) return null
  const folder = type === 'MINIFIG' ? 'MN' : 'MN'
  return `https://img.bricklink.com/ItemImage/${folder}/0/${encodeURIComponent(itemNo)}.png`
}

/** Fetch your entire store inventory (paginates 500 at a time) */
export async function fetchInventoryAll() {
  const out: any[] = []
  let offset = 0
  const limit = 500

  while (true) {
    const data = await blGet('/inventories', { limit, offset })
    const arr = data?.data ?? []
    out.push(...arr)
    if (arr.length < limit) break
    offset += limit
  }
  return out
}