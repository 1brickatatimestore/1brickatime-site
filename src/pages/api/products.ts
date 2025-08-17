// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import themeOverrides from '@/lib/themeOverrides.json'

// ───────────────── helpers ─────────────────

function parseNumber(v: unknown) {
  const n = typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}

function truthy(v: unknown) {
  if (v === undefined || v === null) return false
  const s = String(v).trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

type SortKey = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'
function toSort(sort: unknown): Record<string, 1 | -1> {
  const s = (String(sort || '') as SortKey)
  switch (s) {
    case 'name_desc':
      return { name: -1 }
    case 'price_asc':
      return { price: 1, name: 1 }
    case 'price_desc':
      return { price: -1, name: 1 }
    case 'name_asc':
    default:
      return { name: 1 }
  }
}

/** Build a $or array for a given theme key using themeOverrides (prefix + contains). */
function buildThemeOr(themeKey: string) {
  const or: any[] = []
  const mp = (themeOverrides as any).mapPrefix || {}
  const mc = (themeOverrides as any).mapContains || {}

  for (const [prefix, key] of Object.entries(mp)) {
    if (key === themeKey) or.push({ itemNo: { $regex: `^${prefix}`, $options: 'i' } })
  }
  for (const [frag, key] of Object.entries(mc)) {
    if (key === themeKey) {
      const esc = frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      or.push({ name: { $regex: esc, $options: 'i' } })
    }
  }
  if (or.length === 0) or.push({ _id: { $exists: false } }) // safety
  return or
}

/** $nor for "other" -> not matching any known theme (except "other"). */
function buildOtherNor() {
  const mp = (themeOverrides as any).mapPrefix || {}
  const mc = (themeOverrides as any).mapContains || {}
  const knownKeys = Object.values(mp).concat(Object.values(mc))
  const uniqKeys = Array.from(new Set(knownKeys)).filter((k) => k !== 'other')

  const allOr: any[] = []
  for (const key of uniqKeys) {
    const or = buildThemeOr(String(key))
    allOr.push({ $or: or })
  }
  return allOr.length ? { $nor: allOr } : undefined
}

/** CMF series filter: looks for “Series <n>” in the name. */
function buildSeriesFilter(nRaw: unknown) {
  const n = parseNumber(nRaw)
  if (!n) return undefined
  const rx = new RegExp(`Series\\s*${n}\\b`, 'i')
  return { name: { $regex: rx } }
}

// ───────────────── handler ─────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // Pagination + query params
    const page = Math.max(1, parseNumber(req.query.page) ?? 1)
    const limit = Math.max(1, Math.min(72, parseNumber(req.query.limit) ?? 36))
    const skip = (page - 1) * limit

    const requestedType = (req.query.type as string) || 'MINIFIG'
    const q = (req.query.q as string) || ''
    const cond = (req.query.cond as string) || ''
    const minPrice = parseNumber(req.query.minPrice)
    const maxPrice = parseNumber(req.query.maxPrice)
    const theme = (req.query.theme as string) || ''
    const series = req.query.series
    const includeSoldOut = truthy(req.query.includeSoldOut)
    const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut
    const sort = toSort(req.query.sort)

    const ACTIVE_COLLECTION = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products'
    const PREDEPLOY = 'products_predeploy_20250816T203840Z'

    // Build match
    const match: any = {}

    // Type filter (allow "ALL" to skip). Also include type:null as MINIFIG for the predeploy collection
    if (requestedType && requestedType !== 'ALL') {
      if (ACTIVE_COLLECTION === PREDEPLOY && requestedType === 'MINIFIG') {
        // include docs that forgot to set type
        match.$or = [{ type: 'MINIFIG' }, { type: { $exists: false } }]
      } else {
        match.type = requestedType
      }
    }

    // Stock
    if (onlyInStock) match.qty = { $gt: 0 }

    // Condition
    if (cond === 'N' || cond === 'U') match.condition = cond

    // Price
    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {}
      if (minPrice !== undefined) match.price.$gte = minPrice
      if (maxPrice !== undefined) match.price.$lte = maxPrice
    }

    // Search by name or itemNo prefix
    if (q) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const or = [
        { name: { $regex: esc, $options: 'i' } },
        { itemNo: { $regex: `^${esc}`, $options: 'i' } },
      ]
      match.$and = (match.$and || []).concat([{ $or: or }])
    }

    // Theme
    if (theme) {
      if (theme === 'other') {
        const nor = buildOtherNor()
        if (nor) Object.assign(match, nor)
      } else {
        const or = buildThemeOr(theme)
        if (or.length) match.$and = (match.$and || []).concat([{ $or: or }])
      }
    }

    // Series
    const seriesFilter = buildSeriesFilter(series)
    if (seriesFilter) match.$and = (match.$and || []).concat([seriesFilter])

    // Projection
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

    // Sort label for meta
    const sortLabel = (() => {
      const k = Object.keys(sort)[0]
      const v = Object.values(sort)[0]
      if (!k || (k !== 'name' && k !== 'price')) return 'name_asc'
      return `${k}_${v === 1 ? 'asc' : 'desc'}`
    })()

    res.status(200).json({
      items,
      count,
      page,
      limit,
      __meta: {
        typeApplied:
          ACTIVE_COLLECTION === PREDEPLOY && requestedType === 'MINIFIG'
            ? 'MINIFIG|null'
            : requestedType || null,
        themeApplied: theme || null,
        seriesApplied: series ? String(series) : null,
        onlyInStockApplied: !!onlyInStock,
        includeSoldOutApplied: !!includeSoldOut,
        sort: sortLabel,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) })
  }
}