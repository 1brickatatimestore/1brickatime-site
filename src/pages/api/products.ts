import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import overrides from '@/lib/themeOverrides.json'

type Doc = {
  _id: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  condition?: 'N' | 'U' | string
  qty?: number
  imageUrl?: string
  createdAt?: string | Date
}

/** ---------- helpers ---------- */

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const num = (v: any, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}
const str = (v: any) => (typeof v === 'string' ? v : '')
const truthy = (v: any) => v === '1' || v === 'true' || v === 'yes' || v === true

// reverse index: themeKey -> prefixes[] / contains[]
const prefixEntries = Object.entries(overrides.mapPrefix || {}) // [prefix, key]
const containsEntries = Object.entries(overrides.mapContains || {}) // [needle, key]

function prefixesFor(themeKey: string): string[] {
  return prefixEntries.filter(([, k]) => k === themeKey).map(([p]) => p)
}
function containsFor(themeKey: string): string[] {
  return containsEntries.filter(([, k]) => k === themeKey).map(([t]) => t)
}

/** Build a $match for one theme key (not “other”). */
function themeMatch(themeKey: string) {
  const prefixList = prefixesFor(themeKey)
  const containsList = containsFor(themeKey)

  const or: any[] = []

  if (prefixList.length) {
    // single regex with alternation is faster than many separate $or entries
    const rx = `^(${prefixList.map(escapeRx).join('|')})`
    or.push({ itemNo: { $regex: rx, $options: 'i' } })
  }

  containsList.forEach((t) => {
    or.push({ name: { $regex: escapeRx(t), $options: 'i' } })
  })

  // If mapping is sparse, still allow exact label tokens like "Star Wars"
  if (themeKey === 'collectible-minifigures') {
    // safety for CMF in case mapping ever misses one
    or.push({ itemNo: { $regex: '^col', $options: 'i' } })
    or.push({ name: { $regex: 'collectible\\s+minifig', $options: 'i' } })
  }

  if (!or.length) {
    // If no signals were found, return impossible match so we don't accidentally return everything
    return { _id: { $exists: false } }
  }
  return { $or: or }
}

/** Match for “Other (Singles)” by excluding every mapped theme. */
function otherMatch() {
  const nor: any[] = []

  // exclude all known prefixes
  const allPrefixes = Object.keys(overrides.mapPrefix || {})
  if (allPrefixes.length) {
    const rx = `^(${allPrefixes.map(escapeRx).join('|')})`
    nor.push({ itemNo: { $regex: rx, $options: 'i' } })
  }

  // exclude all known contains
  const allNeedles = Object.keys(overrides.mapContains || {})
  allNeedles.forEach((t) => {
    nor.push({ name: { $regex: escapeRx(t), $options: 'i' } })
  })

  return nor.length ? { $nor: nor } : {}
}

/** Optional CMF series matcher (Series N inside the name). */
function cmfSeriesMatch(series: string) {
  const s = series.trim()
  if (!s) return null
  const rx = new RegExp(`Series\\s*${escapeRx(s)}\\b`, 'i')
  return { name: { $regex: rx } }
}

/** Build server-side sort map */
function buildSort(sort: string | undefined) {
  switch (sort) {
    case 'price_asc':
      return { price: 1, name: 1, itemNo: 1 }
    case 'price_desc':
      return { price: -1, name: 1, itemNo: 1 }
    case 'name_desc':
      return { name: -1 as const, itemNo: -1 as const }
    case 'newest':
      return { createdAt: -1 as const, _id: -1 as const }
    case 'name_asc':
    default:
      return { name: 1, itemNo: 1 }
  }
}

/** Safe field projection for list cards */
const listProject = {
  _id: 1,
  inventoryId: 1,
  itemNo: 1,
  name: 1,
  price: 1,
  condition: 1,
  qty: 1,
  imageUrl: 1,
  createdAt: 1,
}

/** ---------- handler ---------- */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // ---- read & normalize query params
    const page = Math.max(1, num(req.query.page ?? 1, 1))
    const limit = Math.max(1, Math.min(100, num(req.query.limit ?? 36, 36)))

    const type = str(req.query.type) || 'MINIFIG'
    const q = str(req.query.q)
    const cond = str(req.query.cond) // 'N' or 'U'
    const theme = str(req.query.theme)
    const series = str(req.query.series)

    const minPrice = str(req.query.minPrice)
    const maxPrice = str(req.query.maxPrice)

    const includeSoldOut = truthy(req.query.includeSoldOut)
    const excludeStockroom = truthy(req.query.excludeStockroom) // reserved; not applied unless your importer persisted it
    const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut // default: true unless includeSoldOut=1

    const sortKey = str(req.query.sort) || 'name_asc'
    const sort = buildSort(sortKey)

    // ---- base match (type + stock)
    const match: any = {}

    if (type) match.type = type

    if (onlyInStock) {
      // Hide sold-out by default
      match.qty = { $gt: 0 }
    }
    // If in the future you persist a boolean `stockroom`, uncomment:
    // if (excludeStockroom) {
    //   match.$or = [{ stockroom: { $exists: false } }, { stockroom: false }]
    // }

    if (cond === 'N' || cond === 'U') match.condition = cond

    if (minPrice || maxPrice) {
      const p: any = {}
      const lo = parseFloat(minPrice)
      const hi = parseFloat(maxPrice)
      if (!Number.isNaN(lo)) p.$gte = lo
      if (!Number.isNaN(hi)) p.$lte = hi
      if (Object.keys(p).length) match.price = p
    }

    if (q) {
      const rx = new RegExp(escapeRx(q), 'i')
      match.$or = [
        ...(match.$or ?? []),
        { name: { $regex: rx } },
        { itemNo: { $regex: rx } },
      ]
    }

    // ---- theme filter
    if (theme) {
      if (theme === 'other') {
        Object.assign(match, otherMatch())
      } else {
        Object.assign(match, themeMatch(theme))
        // CMF series narrowing
        if (theme === 'collectible-minifigures' && series) {
          const s = cmfSeriesMatch(series)
          if (s) Object.assign(match, s)
        }
      }
    } else if (series) {
      // Series only makes sense for CMF; if user passes series without theme, assume CMF
      Object.assign(match, themeMatch('collectible-minifigures'))
      const s = cmfSeriesMatch(series)
      if (s) Object.assign(match, s)
    }

    // ---- count + page
    const [count, items] = await Promise.all([
      Product.countDocuments(match),
      Product.find(match, listProject)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    // Safety: ensure numeric price and qty for UI
    const cleaned = (items as Doc[]).map((d) => ({
      ...d,
      price: Number(d.price ?? 0),
      qty: Number(d.qty ?? 0),
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    }))

    res.status(200).json({
      items: cleaned,
      count,
      page,
      limit,
      __meta: {
        typeApplied: type || null,
        themeApplied: theme || null,
        seriesApplied: series || null,
        onlyInStockApplied: !!onlyInStock,
        includeSoldOutApplied: !!includeSoldOut,
        sort: sortKey,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      },
    })
  } catch (err: any) {
    console.error('products API error:', err)
    res.status(500).json({ error: 'server_error', message: err?.message || 'unknown' })
  }
}