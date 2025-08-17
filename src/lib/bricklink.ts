// src/lib/bricklink.ts
import crypto from 'crypto'

const BL_BASE = 'https://api.bricklink.com/api/store/v1'

function percentEncode(s: string) {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

function buildOAuthHeader(method: string, url: string, query: Record<string,string>, env: any) {
  const oauth: Record<string,string> = {
    oauth_consumer_key: env.BL_KEY,
    oauth_token: env.BL_TOKEN,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now()/1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
  }
  const all = { ...query, ...oauth }
  const paramString = Object.keys(all).sort().map(k=>`${percentEncode(k)}=${percentEncode(all[k])}`).join('&')
  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join('&')
  const signingKey = `${percentEncode(env.BL_SECRET)}&${percentEncode(env.BL_TOKEN_SECRET)}`
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
  const header = 'OAuth ' + Object.keys(oauth).concat('oauth_signature').sort().map(k=>{
    const v = k === 'oauth_signature' ? signature : (oauth as any)[k]
    return `${percentEncode(k)}="${percentEncode(v)}"`
  }).join(', ')
  return header
}

async function blGet(path: string, query: Record<string,string>, env: any) {
  const url = `${BL_BASE}${path}`
  const auth = buildOAuthHeader('GET', url, query, env)
  const qs = Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : ''
  const res = await fetch(url + qs, { headers: { Authorization: auth, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`BrickLink ${res.status} ${res.statusText}`)
  return res.json()
}

export type BLInventory = {
  inventory_id: number
  item: { no: string; name?: string; type?: string }
  quantity: number
  new_or_used: 'N'|'U'
  unit_price: number|string
  remarks?: string
  description?: string
  stock_room_id?: 'A'|'B'|'C'|null
}

export async function fetchAllMinifigInventories(env: any): Promise<BLInventory[]> {
  const out: BLInventory[] = []
  const limit = 100
  let offset = 0
  while (true) {
    const data = await blGet('/inventories', { item_type: 'MINIFIG', limit: String(limit), offset: String(offset) }, env)
    const page: BLInventory[] = Array.isArray(data?.data) ? data.data : []
    out.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return out
}

export function minifigToImageUrl(itemNo: string) {
  return `https://img.bricklink.com/ItemImage/MN/0/${itemNo}.png`
}