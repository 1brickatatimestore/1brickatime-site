// src/pages/api/sync-bricklink.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import dbConnect from '../../lib/db'
import ProductModel from '../../models/Product'

type BrickLinkItem = any

function pctEncode(s: string) {
  return encodeURIComponent(s)
    .replace(/[!*()']/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function makeNonce(len = 24) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}

/**
 * Build OAuth1 Authorization header (HMAC-SHA1).
 * url: full URL string WITHOUT query parameters already appended? (we pass base URL)
 * method: "GET" etc.
 * params: object of query params that will be in the request (will be included in base string)
 */
function buildOAuthHeader({
  method,
  baseUrl,
  params,
  consumerKey,
  consumerSecret,
  token,
  tokenSecret,
}: {
  method: string
  baseUrl: string
  params: Record<string, string>
  consumerKey: string
  consumerSecret: string
  token?: string
  tokenSecret?: string
}) {
  const oauth: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: makeNonce(32),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
  }
  if (token) oauth.oauth_token = token

  // collect all params: oauth + query params
  const allParams: [string, string][] = []
  for (const k of Object.keys(oauth)) allParams.push([k, oauth[k]])
  for (const k of Object.keys(params || {})) allParams.push([k, params[k]])

  // percent-encode keys and values, sort by key then value
  const encoded = allParams
    .map(([k, v]) => [pctEncode(k), pctEncode(v)])
    .sort((a: string[], b: string[]) => {
      if (a[0] < b[0]) return -1
      if (a[0] > b[0]) return 1
      if (a[1] < b[1]) return -1
      if (a[1] > b[1]) return 1
      return 0
    })

  const paramString = encoded.map(([k, v]) => `${k}=${v}`).join('&')
  const baseString =
    method.toUpperCase() + '&' + pctEncode(baseUrl) + '&' + pctEncode(paramString)

  const signingKey = pctEncode(consumerSecret || '') + '&' + pctEncode(tokenSecret || '')
  const hmac = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
  oauth.oauth_signature = hmac

  // build Authorization header value
  const header = 'OAuth ' + Object.keys(oauth)
    .sort()
    .map(k => `${pctEncode(k)}="${pctEncode(oauth[k])}"`)
    .join(', ')
  return header
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 25000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow quick debug
  const { debug = '', limit: qLimit, import: importFlag, dry = '' } = req.query

  const BL_KEY = process.env.BL_KEY
  const BL_SECRET = process.env.BL_SECRET
  const BL_TOKEN = process.env.BL_TOKEN
  const BL_TOKEN_SECRET = process.env.BL_TOKEN_SECRET
  const BL_USER_ID = process.env.BL_USER_ID || process.env.BL_USER || ''

  if (!BL_KEY || !BL_SECRET || !BL_TOKEN) {
    return res.status(500).json({ success: false, error: 'Missing Bricklink credentials in env' })
  }
  if (!BL_USER_ID) {
    return res.status(500).json({ success: false, error: 'Missing BL_USER_ID in env' })
  }

  // per-request page size (Bricklink accepts up to 1000)
  const perPage = Math.min(Number(qLimit ?? 1000), 1000) || 1000
  const doImport = String(importFlag || '') === '1' && String(dry || '') !== '1'
  const doDry = String(dry || '') === '1'

  const baseUrl = `https://api.bricklink.com/api/store/v1/inventories`
  // we'll append ?user_id=...&offset=...&limit=...
  let offset = 0
  const sample: any[] = []
  let fetchedTotal = 0
  let pages = 0

  // debug=raw -> only return URL & header for the first request (useful to test in curl)
  if (String(debug) === 'raw') {
    const params = { user_id: String(BL_USER_ID), offset: '0', limit: String(perPage) }
    const url = `${baseUrl}?user_id=${encodeURIComponent(params.user_id)}&offset=${params.offset}&limit=${params.limit}`
    const authHeader = buildOAuthHeader({
      method: 'GET',
      baseUrl,
      params,
      consumerKey: BL_KEY,
      consumerSecret: BL_SECRET,
      token: BL_TOKEN,
      tokenSecret: BL_TOKEN_SECRET,
    })
    return res.status(200).json({ success: true, url, headers: { Authorization: authHeader, Accept: 'application/json' } })
  }

  // If we will import into DB, ensure connection is ready
  if (doImport && !doDry) {
    try {
      await dbConnect()
    } catch (err: any) {
      console.error('dbConnect error', err)
      return res.status(500).json({ success: false, error: 'DB connect failed', detail: String(err?.message || err) })
    }
  }

  try {
    // loop pages. Stop when a page returns fewer than perPage (no more items).
    for (;;) {
      const params = { user_id: String(BL_USER_ID), offset: String(offset), limit: String(perPage) }
      const url = `${baseUrl}?user_id=${encodeURIComponent(params.user_id)}&offset=${params.offset}&limit=${params.limit}`

      const authHeader = buildOAuthHeader({
        method: 'GET',
        baseUrl,
        params,
        consumerKey: BL_KEY,
        consumerSecret: BL_SECRET,
        token: BL_TOKEN,
        tokenSecret: BL_TOKEN_SECRET,
      })

      // server logs
      const start = Date.now()
      const resp = await fetchWithTimeout(url, { method: 'GET', headers: { Authorization: authHeader, Accept: 'application/json' } }, 30000)
      const elapsed = Date.now() - start
      console.log(`sync-bricklink: GET ${url} -> status ${resp.status} (elapsed ${elapsed}ms)`)

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        console.error('Bricklink fetch error', resp.status, txt)
        return res.status(500).json({ success: false, error: `Bricklink request failed: ${resp.status}`, detail: txt })
      }

      const body = await resp.json().catch(() => null)
      if (!body || !Array.isArray(body.data || body.sample || body)) {
        // some Bricklink responses embed data in `data` or return array directly or `sample` — try to adapt:
        const arr = body?.data || body?.sample || body
        if (!Array.isArray(arr)) {
          // unknown structure
          return res.status(500).json({ success: false, error: 'Unexpected Bricklink response structure', body })
        }
        // else we will treat arr as items
        (arr as any[]).forEach(it => sample.push(it))
        fetchedTotal += (arr as any[]).length
        pages++
        // if arr length < perPage -> done
        if ((arr as any[]).length < perPage) break
        offset += perPage
        continue
      }

      // When response has "data" or returns array
      const items: BrickLinkItem[] = body.data ?? body.sample ?? body
      // accumulate a sample of first 20 results for the response body
      for (let i = 0; i < items.length && sample.length < 20; i++) sample.push(items[i])

      // optionally upsert products into MongoDB in bulk (per page)
      if (doImport && !doDry) {
        const ops = items.map((inv: any) => {
          // transform Bricklink inventory item -> Product model fields
          const inventoryId = Number(inv.inventory_id || inv.inventoryId || 0) || undefined
          const itemNo = inv.item?.no ?? inv.item_no ?? ''
          const pType = (inv.item?.type ?? '').toUpperCase()
          // price might be unit_price or price
          const unitPrice = parseFloat(String(inv.unit_price ?? inv.price ?? 0)) || 0
          const qty = Number(inv.quantity ?? inv.qty ?? 0)
          const doc: any = {
            inventoryId,
            itemNo,
            type: (pType === 'MINIFIG' ? 'MINIFIG' : (pType === 'SET' ? 'SET' : 'PART')),
            categoryId: inv.item?.category_id ?? inv.category_id,
            name: inv.item?.name ?? inv.name ?? '',
            price: unitPrice,
            qty,
            condition: inv.new_or_used ?? inv.condition,
            imageUrl: inv.imageUrl ?? inv.item?.imageUrl ?? '',
            description: inv.description ?? '',
            remarks: inv.remarks ?? '',
          }
          // upsert by inventoryId if present, otherwise by itemNo (not ideal, but fallback)
          const filter = (inventoryId ? { inventoryId } : { itemNo: doc.itemNo })
          const update = { $set: doc, $setOnInsert: { createdAt: new Date() } }
          return { updateOne: { filter, update, upsert: true } }
        })

        if (ops.length > 0) {
          try {
            // execute bulkWrite in batches to avoid huge operations
            const BATCH = 500
            for (let i = 0; i < ops.length; i += BATCH) {
              const batch = ops.slice(i, i + BATCH)
              await ProductModel.bulkWrite(batch, { ordered: false })
            }
          } catch (err: any) {
            console.error('DB bulkWrite error', err)
            // continue but report warning
          }
        }
      }

      fetchedTotal += items.length
      pages++

      // stop when fewer than perPage received
      if (items.length < perPage) break

      // page forward
      offset += perPage

      // safety limit: avoid infinite loops — stop after 10000 pages
      if (pages > 10000) {
        console.warn('sync-bricklink: safety break after 10000 pages')
        break
      }
    } // end loop

    return res.status(200).json({
      success: true,
      fetched: fetchedTotal,
      pages,
      sample,
      note: `Fetched ${fetchedTotal} items (paginated ${pages} pages, perPage ${perPage}).`,
      imported: doImport && !doDry ? 'attempted' : 'skipped',
    })
  } catch (err: any) {
    console.error('sync-bricklink error', err)
    return res.status(500).json({ success: false, error: String(err?.message || err) })
  }
}