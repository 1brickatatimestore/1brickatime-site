// src/pages/api/sync/bricklink.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import oauthSignature from 'oauth-signature'

const {
  BL_KEY,
  BL_SECRET,
  BL_TOKEN,
  BL_TOKEN_SECRET,
  ADMIN_KEY,
  MONGODB_DB = 'bricklink',
} = process.env

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/[!*()']/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

function decodeHtml(input?: string | null) {
  if (!input) return ''
  return input
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function safeImage(itemNo?: string | null, imageUrl?: string | null) {
  const direct = (imageUrl || '').trim()
  if (direct) return direct
  const code = (itemNo || '').trim()
  return code ? `https://img.bricklink.com/ItemImage/MN/0/${code}.png` : null
}

async function blGet(path: string, query: Record<string, string | number> = {}) {
  if (!BL_KEY || !BL_SECRET || !BL_TOKEN || !BL_TOKEN_SECRET) {
    throw new Error('BrickLink API keys missing')
  }

  const baseUrl = 'https://api.bricklink.com/api/store/v1'
  const url = `${baseUrl}${path}`

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: BL_KEY,
    oauth_token: BL_TOKEN,
    oauth_nonce: Math.random().toString(36).slice(2),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  }

  const allParams: Record<string, string> = {
    ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])),
    ...oauthParams,
  }

  const signature = oauthSignature.generate('GET', url, allParams, BL_SECRET, BL_TOKEN_SECRET)
  const authHeader = `OAuth oauth_consumer_key="${percentEncode(BL_KEY)}", oauth_token="${percentEncode(
    BL_TOKEN
  )}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${oauthParams.oauth_timestamp}", oauth_nonce="${
    oauthParams.oauth_nonce
  }", oauth_version="1.0", oauth_signature="${percentEncode(signature)}"`

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) qs.set(k, String(v))

  const resp = await fetch(`${url}?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`BrickLink ${path} ${resp.status}: ${text}`)
  }
  return resp.json()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.query.ping) {
      return res.status(200).json({ ok: true, hello: 'sync endpoint alive' })
    }

    if (!ADMIN_KEY || String(req.query.key) !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await dbConnect(process.env.MONGODB_URI!)
    mongoose.connection.useDb(MONGODB_DB)

    // Pull entire inventory (BrickLink returns paging; pull pages until empty)
    let page = 1
    const pageSize = 500
    let totalUpserted = 0
    const upsertedItemNos: string[] = []

    for (;;) {
      const data = await blGet('/inventories', { page, page_size: pageSize })
      const list: any[] = Array.isArray(data?.data) ? data.data : []
      if (list.length === 0) break

      for (const row of list) {
        // We only care about minifigs for your storefront; you can broaden later.
        const type = row?.item?.type || row?.type || row?.item_type || ''
        if (String(type).toUpperCase() !== 'MINIFIG') continue

        const itemNo: string | null = row?.item?.no || row?.item_no || null
        const nameRaw: string | null = row?.item?.name || row?.name || null
        const price: number | null =
          typeof row?.unit_price === 'number' ? row.unit_price :
          typeof row?.price === 'number' ? row.price : null
        const qty: number = typeof row?.quantity === 'number' ? row.quantity : 0
        const condition: string | null =
          row?.new_or_used || row?.condition || null

        const name = decodeHtml(nameRaw)
        const imageUrl = safeImage(itemNo, row?.image_url || row?.imageUrl || null)

        // Skip stockroom items (A/B/C) => not for sale
        const stockroom = (row?.stockroom || '').toString().toUpperCase()
        const isForSale = !['A', 'B', 'C'].includes(stockroom)

        if (!isForSale) continue

        await Product.updateOne(
          itemNo ? { itemNo } : { _id: row?._id ?? undefined },
          {
            $set: {
              itemNo: itemNo ?? null,
              name: name || itemNo || null,
              imageUrl,
              price,
              qty,
              condition: condition || undefined,
              type: 'MINIFIG',
            },
          },
          { upsert: true }
        )

        if (itemNo) upsertedItemNos.push(itemNo)
        totalUpserted++
      }

      if (list.length < pageSize) break
      page++
    }

    // Optional prune: remove products of type MINIFIG not returned this run
    const prune = String(req.query.prune || '') === '1'
    let pruned = 0
    if (prune && upsertedItemNos.length) {
      const r = await Product.deleteMany({
        type: 'MINIFIG',
        itemNo: { $nin: upsertedItemNos },
      })
      pruned = r.deletedCount || 0
    }

    return res.status(200).json({
      ok: true,
      upserted: totalUpserted,
      pruned,
      kept: upsertedItemNos.length,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) })
  }
}