// src/pages/api/sync-bricklink.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

type BLMeta = { code?: number; message?: string; description?: string }
type BLResp<T = any> = { meta?: BLMeta; data?: T }

const BL_BASE = 'https://api.bricklink.com/api/store/v1' // ✅ Store API

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

function authHeaders(url: string, method: 'GET' | 'POST' = 'GET') {
  const token = {
    key: BRICKLINK_TOKEN_VALUE || '',
    secret: BRICKLINK_TOKEN_SECRET || '',
  }
  return oauth.toHeader(oauth.authorize({ url, method }, token))
}

// Fetch a single page from /inventories
async function fetchInventoriesPage(limit: number, offset: number) {
  const url = `${BL_BASE}/inventories?limit=${limit}&offset=${offset}`
  const headers = { ...authHeaders(url, 'GET'), 'Content-Type': 'application/json' }
  const r = await fetch(url, { headers, cache: 'no-store' })
  const text = await r.text()

  let json: BLResp<any[]>
  try { json = JSON.parse(text) } catch {
    throw new Error(`Non-JSON from BrickLink (${r.status}) at ${url}: ${text.slice(0, 300)}`)
  }

  const code = json.meta?.code ?? r.status
  if (!r.ok || (code && code >= 400)) {
    const msg = json.meta?.message || json.meta?.description || `HTTP ${r.status}`
    throw new Error(`BrickLink error at ${url}: ${msg}`)
  }
  return { url, data: Array.isArray(json.data) ? json.data : [] as any[] }
}

// Fetch all pages (up to a cap) and return combined list
async function fetchAllInventories(maxPages: number, pageSize: number) {
  const called: string[] = []
  const all: any[] = []
  for (let i = 0; i < maxPages; i++) {
    const offset = i * pageSize
    const { url, data } = await fetchInventoriesPage(pageSize, offset)
    called.push(url)
    all.push(...data)
    if (data.length < pageSize) break // last page
  }
  return { called, all }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const debug = String(req.query.debug || '') === '1'
    const includeStockroom = String(req.query.includeStockroom || 'false') === 'true'
    const pageSize = Math.max(1, Math.min(100, Number(req.query.limit) || 50))
    const maxPages = Math.max(1, Math.min(50, Number(req.query.maxPages) || 10))
    const minQty = Number.isFinite(Number(req.query.minQty)) ? Number(req.query.minQty) : 0

    const { called, all } = await fetchAllInventories(maxPages, pageSize)

    // Filter rules:
    const filtered = all.filter((row: any) => {
      // stockroom: BrickLink returns something like 'Y'/'N' or 'S' slots; we treat truthy as stockroom
      const inStockroom =
        row?.stockroom === true ||
        row?.stockroom === 1 ||
        row?.stockroom === 'Y' ||
        row?.stockroom === 'S' ||
        row?.stockroom === 'A' || row?.stockroom === 'B' || row?.stockroom === 'C'

      if (!includeStockroom && inStockroom) return false
      const qty = Number(row?.quantity ?? row?.qty ?? 0)
      if (qty < minQty) return false
      return true
    })

    // Minimal projection (keep what’s useful to inspect)
    const inventory = filtered.map((r: any) => ({
      inventory_id: r.inventory_id ?? r.id ?? null,
      item: r.item || { no: r.item_no, type: r.item_type },
      color_id: r.color_id ?? r.color,
      quantity: r.quantity ?? r.qty,
      new_or_used: r.new_or_used ?? r.condition,
      unit_price: r.unit_price,
      stockroom: r.stockroom ?? null,
      remarks: r.remarks ?? r.description ?? null,
      status: r.status ?? null,
      sale: r.sale ?? null,
      updated: r.date_modified ?? r.date_updated ?? r.date_created,
    }))

    const response: any = {
      success: true,
      count: inventory.length,
      inventory,
    }
    if (debug) {
      response.debug = {
        called,
        rawCount: all.length,
        filteredCount: inventory.length,
        sample: inventory.slice(0, 5),
      }
    }
    return res.status(200).json(response)
  } catch (err: any) {
    return res.status(200).json({ success: false, error: err?.message || String(err) })
  }
}