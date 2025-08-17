// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import themeOverrides from '@/lib/themeOverrides.json'

export const runtime = 'nodejs'

// ───────── helpers ─────────
function parseNumber(v: unknown) {
  const n = typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}
function truthy(v: unknown) {
  if (v === undefined) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}
type SortKey = 'name_asc'|'name_desc'|'price_asc'|'price_desc'
function toSort(sort: unknown): Record<string, 1|-1> {
  const s = (String(sort || '') as SortKey)
  switch (s) {
    case 'name_desc':  return { name: -1 }
    case 'price_asc':  return { price: 1,  name: 1 }
    case 'price_desc': return { price: -1, name: 1 }
    case 'name_asc':
    default:           return { name: 1 }
  }
}

// theme mapping
function buildThemeOr(themeKey: string) {
  const or: any[] = []
  for (const [prefix, key] of Object.entries(themeOverrides.mapPrefix || {})) {
    if (key === themeKey) or.push({ itemNo: { $regex: `^${prefix}`, $options: 'i' } })
  }
  for (const [frag, key] of Object.entries(themeOverrides.mapContains || {})) {
    if (key === themeKey) {
      const esc = frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      or.push({ name: { $regex: esc, $options: 'i' } })
    }
  }
  if (or.length === 0) or.push({ _id: { $exists: false } })
  return or
}
function buildOtherNor() {
  const allOr: any[] = []
  const knownKeys = Object.values(themeOverrides.mapPrefix || {}).concat(
    Object.values(themeOverrides.mapContains || {})
  )
  const uniqKeys = Array.from(new Set(knownKeys)).filter(k => k !== 'other')
  for (const key of uniqKeys) {
    const or = buildThemeOr(key)
    allOr.push({ $or: or })
  }
  if (allOr.length === 0) return undefined
  return { $nor: allOr }
}
function buildSeriesFilter(nRaw: unknown) {
  const n = parseNumber(nRaw)
  if (!n) return undefined
  const rx = new RegExp(`Series\\s*${n}\\b`, 'i')
  return { name: { $regex: rx } }
}

// ───────── DEBUG responder (db-stats) ─────────
async function debugStats() {
  // Ensure connection & resolve names
  // @ts-ignore - mongoose types are fine at runtime
  const conn = await dbConnect(process.env.MONGODB_URI!)
  const dbName = conn?.connection?.db?.databaseName || process.env.MONGODB_DB || 'bricklink'

  // Current model’s *actual* collection name (resolved from env at boot)
  // @ts-ignore
  const activeCollection = Product.collection?.name as string

  // Compare several product-like collections if they exist
  const adminDb = conn.connection.client.db(dbName)
  const infos = await adminDb.listCollections({}, { nameOnly: true }).toArray()
  const names = infos.map(i => i.name).filter(n => /products/i.test(n))

  // helper to count
  const countIn = async (name: string, query: any = {}) =>
    adminDb.collection(name).countDocuments(query)

  const results = []
  for (const n of names) {
    const total   = await countIn(n)
    const mfAll   = await countIn(n, { type: 'MINIFIG' })
    const mfStock = await countIn(n, { type: 'MINIFIG', qty: { $gt: 0 } })
    results.push({ collection: n, total, mfAll, mfStock })
  }
  results.sort((a,b)=> (b.mfStock - a.mfStock) || (b.mfAll - a.mfAll) || (b.total - a.total))

  return {
    dbName,
    activeCollection,
    productsCollectionEnv: process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products',
    results
  }
}

// ───────── main handler ─────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // DEBUG MODE: /api/products?debug=1  -> returns DB/collection stats
  if (truthy(req.query.debug)) {
    try {
      const stats = await debugStats()
      return res.status(200).json(stats)
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || String(e) })
    }
  }

  await dbConnect(process.env.MONGODB_URI!)

  // Pagination
  const page = Math.max(1, parseNumber(req.query.page) ?? 1)
  const limit = Math.max(1, Math.min(72, parseNumber(req.query.limit) ?? 36))
  const skip = (page - 1) * limit

  // Filters
  const type = (req.query.type as string) || 'MINIFIG' // default to MINIFIG
  const q = (req.query.q as string) || ''
  const cond = (req.query.cond as string) || ''
  const minPrice = parseNumber(req.query.minPrice)
  const maxPrice = parseNumber(req.query.maxPrice)
  const theme = (req.query.theme as string) || ''
  const series = req.query.series
  const includeSoldOut = truthy(req.query.includeSoldOut)
  const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut
  const sort = toSort(req.query.sort)

  // Build Mongo match
  const match: any = {}

  // type (allow ALL to skip)
  if (type && type !== 'ALL') match.type = type

  // stock
  if (onlyInStock) match.qty = { $gt: 0 }

  // condition
  if (cond === 'N' || cond === 'U') match.condition = cond

  // price
  if (minPrice !== undefined || maxPrice !== undefined) {
    match.price = {}
    if (minPrice !== undefined) match.price.$gte = minPrice
    if (maxPrice !== undefined) match.price.$lte = maxPrice
  }

  // search
  if (q) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    match.$or = [
      { name:  { $regex: esc, $options: 'i' } },
      { itemNo:{ $regex: `^${esc}`, $options: 'i' } },
    ]
  }

  // theme filter
  if (theme) {
    if (theme === 'other') {
      const nor = buildOtherNor()
      if (nor) Object.assign(match, nor)
    } else {
      const or = buildThemeOr(theme)
      if (or.length) match.$and = (match.$and || []).concat([{ $or: or }])
    }
  }

  // CMF series (e.g., series=26)
  const seriesFilter = buildSeriesFilter(series)
  if (seriesFilter) {
    match.$and = (match.$and || []).concat([seriesFilter])
  }

  // Projection: keep payloads light
  const projection = { createdAt: 0, updatedAt: 0, __v: 0 }

  // Query + count
  const [items, count] = await Promise.all([
    Product.find(match)
      .sort(sort)
      .collation({ locale: 'en', strength: 1 })
      .skip(skip)
      .limit(limit)
      .select(projection)
      .lean(),
    Product.countDocuments(match),
  ])

  // reflect sort value back as a string
  const sortKey = (() => {
    const [k, dir] = Object.entries(sort)[0] || ['name', 1]
    if (k === 'name') return dir === 1 ? 'name_asc' : 'name_desc'
    if (k === 'price') return dir === 1 ? 'price_asc' : 'price_desc'
    return 'name_asc'
  })()

  return res.status(200).json({
    items,
    count,
    page,
    limit,
    __meta: {
      typeApplied: type || null,
      themeApplied: theme || null,
      seriesApplied: series ? String(series) : null,
      onlyInStockApplied: !!onlyInStock,
      includeSoldOutApplied: !!includeSoldOut,
      sort: sortKey,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
    },
  })
}