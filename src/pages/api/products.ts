// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import themeOverrides from '@/lib/themeOverrides.json'

// --- utils ---
function parseNumber(v: unknown) {
  const n = typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}
function truthy(v: unknown) {
  if (v === undefined) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}
type SortKey = 'name_asc'|'name_desc'|'price_asc'|'price_desc'|'newest'|'oldest'
function toSort(sort: unknown): Record<string, 1|-1> {
  const s = (String(sort || '') as SortKey)
  switch (s) {
    case 'name_desc':  return { name: -1 }
    case 'price_asc':  return { price: 1,  name: 1 }
    case 'price_desc': return { price: -1, name: 1 }
    case 'oldest':     return { _id: 1 }
    case 'newest':     return { _id: -1 }
    case 'name_asc':
    default:           return { name: 1 }
  }
}

// theme helpers
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
  for (const key of uniqKeys) allOr.push({ $or: buildThemeOr(key) })
  if (allOr.length === 0) return undefined
  return { $nor: allOr }
}
function buildSeriesFilter(nRaw: unknown) {
  const n = parseNumber(nRaw)
  if (!n) return undefined
  const rx = new RegExp(`Series\\s*${n}\\b`, 'i')
  return { name: { $regex: rx } }
}

// --- handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect(process.env.MONGODB_URI!)

  // paging
  const page  = Math.max(1, parseNumber(req.query.page) ?? 1)
  const limit = Math.max(1, Math.min(72, parseNumber(req.query.limit) ?? 36))
  const skip  = (page - 1) * limit

  // filters
  const type = (req.query.type as string) || 'MINIFIG'
  const q = (req.query.q as string) || ''
  const cond = (req.query.cond as string) || ''
  const minPrice = parseNumber(req.query.minPrice)
  const maxPrice = parseNumber(req.query.maxPrice)
  const theme = (req.query.theme as string) || ''
  const series = req.query.series
  const includeSoldOut = truthy(req.query.includeSoldOut)
  const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut
  const sort = toSort(req.query.sort || 'name_asc')

  const match: any = {}

  // enforce minifigs unless ALL specified
  if (type && type !== 'ALL') match.type = 'MINIFIG'

  if (onlyInStock) match.qty = { $gt: 0 }
  if (cond === 'N' || cond === 'U') match.condition = cond

  if (minPrice !== undefined || maxPrice !== undefined) {
    match.price = {}
    if (minPrice !== undefined) match.price.$gte = minPrice
    if (maxPrice !== undefined) match.price.$lte = maxPrice
  }

  // denylist: exclude stickers / sheets / stickered
  const denySticker = {
    $nor: [
      { itemNo: { $regex: /^(stk|sticker)/i } },
      { name:   { $regex: /(sticker|sheet|stickered)/i } },
      { categoryName: { $regex: /sticker/i } }, // if present in docs
    ],
  }
  match.$and = (match.$and || []).concat([denySticker])

  if (q) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    match.$and = (match.$and || []).concat([{
      $or: [
        { name: { $regex: esc, $options: 'i' } },
        { itemNo: { $regex: `^${esc}`, $options: 'i' } }
      ]
    }])
  }

  if (theme) {
    if (theme === 'other') {
      const nor = buildOtherNor()
      if (nor) Object.assign(match, nor)
    } else {
      match.$and = (match.$and || []).concat([{ $or: buildThemeOr(theme) }])
    }
  }

  const seriesFilter = buildSeriesFilter(series)
  if (seriesFilter) match.$and = (match.$and || []).concat([seriesFilter])

  const projection = { createdAt: 0, updatedAt: 0, __v: 0 }

  const [items, count] = await Promise.all([
    Product.find(match)
      .sort(sort).collation({ locale: 'en', strength: 1 })
      .skip(skip).limit(limit).select(projection).lean(),
    Product.countDocuments(match),
  ])

  res.status(200).json({
    items, count, page, limit,
    __meta: {
      typeApplied: type || null,
      themeApplied: theme || null,
      seriesApplied: series ? String(series) : null,
      onlyInStockApplied: !!onlyInStock,
      includeSoldOutApplied: !!includeSoldOut,
      sort: Object.keys(sort)[0] + '_' + (Object.values(sort)[0] === 1 ? 'asc' : 'desc'),
      minPrice: minPrice ?? null, maxPrice: maxPrice ?? null,
    },
  })
}