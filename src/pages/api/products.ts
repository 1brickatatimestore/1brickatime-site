import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import overrides from '@/lib/themeOverrides.json'

type Item = {
  _id?: string
  inventoryId?: number
  type?: string
  itemNo?: string
  name?: string
  price?: number
  condition?: string
  imageUrl?: string
  quantity?: number
  qty?: number
  stock?: number
  inStock?: boolean
}

type Data = {
  count: number
  items: Item[]
}

const isTruthy = (v: any) => v === 1 || v === '1' || v === true || v === 'true'

// ---- THEME HELPERS ----------------------------------------------------------

/**
 * Compile regexes once from themeOverrides.json
 */
type ThemeMap = {
  [slug: string]: { prefixes?: string[]; contains?: string[] }
}
const themeMap: ThemeMap = (() => {
  const out: ThemeMap = {}
  const src = overrides as any

  const toArray = (v: any) =>
    Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []

  if (src?.mapPrefix) {
    for (const [pref, slug] of Object.entries<string>(src.mapPrefix)) {
      out[slug] ||= {}
      out[slug].prefixes ||= []
      out[slug].prefixes!.push(pref)
    }
  }
  if (src?.mapContains) {
    for (const [frag, slug] of Object.entries<string>(src.mapContains)) {
      out[slug] ||= {}
      out[slug].contains ||= []
      out[slug].contains!.push(frag)
    }
  }
  // normalize + uniq
  for (const slug of Object.keys(out)) {
    out[slug].prefixes = Array.from(new Set(toArray(out[slug].prefixes)))
    out[slug].contains = Array.from(new Set(toArray(out[slug].contains)))
  }
  return out
})()

/**
 * Build a Mongo match object for a specific theme slug.
 * - For normal themes: OR of (itemNo startsWith any prefix) OR (name contains any fragment)
 * - For "collectible-minifigures" with ?series=N: filter by series number in the name
 * - For "other": NEGATION of ALL known theme tests (i.e., not matching any theme)
 */
function buildThemeMatch(theme?: string, series?: string) {
  if (!theme || theme === '__ALL__') return {}

  const lc = theme.toLowerCase()

  // CMF series handling
  if (lc === 'collectible-minifigures') {
    if (series && /^[0-9]+$/.test(series)) {
      const n = Number(series)
      // Match e.g. "Series 11" / "Series 11" in the name
      return {
        name: { $regex: new RegExp(`\\bSeries\\s*${n}\\b`, 'i') },
      }
    }
    // CMF without series = just the theme
    const t = themeMap['collectible-minifigures'] || { prefixes: [], contains: [] }
    return orFromThemeParts(t)
  }

  if (lc === 'other') {
    // Build a single big $nor that rejects ANY known theme
    const allParts = collectAllThemePartsExcluding('other')
    const nor: any[] = []
    if (allParts.prefixes.length) {
      const big = new RegExp(`^(${allParts.prefixes.map(escapeRx).join('|')})`, 'i')
      nor.push({ itemNo: { $regex: big } })
    }
    if (allParts.contains.length) {
      const anyFrag = new RegExp(`(${allParts.contains.map(escapeRx).join('|')})`, 'i')
      nor.push({ name: { $regex: anyFrag } })
    }
    // If we have nothing to negate, fall back to {} (rare)
    return nor.length ? { $nor: nor } : {}
  }

  // Normal named theme
  const t = themeMap[lc] || { prefixes: [], contains: [] }
  return orFromThemeParts(t)
}

function collectAllThemePartsExcluding(excludeSlug: string) {
  const prefixes: string[] = []
  const contains: string[] = []
  for (const [slug, parts] of Object.entries(themeMap)) {
    if (slug === excludeSlug) continue
    if (parts.prefixes?.length) prefixes.push(...parts.prefixes)
    if (parts.contains?.length) contains.push(...parts.contains)
  }
  return { prefixes: Array.from(new Set(prefixes)), contains: Array.from(new Set(contains)) }
}

function orFromThemeParts(parts: { prefixes?: string[]; contains?: string[] }) {
  const or: any[] = []
  if (parts.prefixes?.length) {
    const rx = new RegExp(`^(${parts.prefixes.map(escapeRx).join('|')})`, 'i')
    or.push({ itemNo: { $regex: rx } })
  }
  if (parts.contains?.length) {
    const rx = new RegExp(`(${parts.contains.map(escapeRx).join('|')})`, 'i')
    or.push({ name: { $regex: rx } })
  }
  return or.length ? { $or: or } : {}
}

function escapeRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---- API --------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data | any>) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const {
      type = 'MINIFIG',
      page = '1',
      limit = '36',
      q = '',
      cond = '',
      onlyInStock = '',
      theme = '__ALL__',
      series = '',
    } = req.query as Record<string, string>

    const pg = Math.max(1, Number(page) || 1)
    const lim = Math.max(1, Math.min(120, Number(limit) || 36))
    const skip = (pg - 1) * lim

    const match: any = {}
    if (type) match.type = String(type).toUpperCase()

    // search
    const nameNo = String(q || '').trim()
    if (nameNo) {
      match.$or = [
        { name: { $regex: new RegExp(escapeRx(nameNo), 'i') } },
        { itemNo: { $regex: new RegExp(escapeRx(nameNo), 'i') } },
      ]
    }

    // condition
    if (cond === 'N' || cond === 'U') match.condition = cond

    // stock
    if (isTruthy(onlyInStock)) {
      match.$or = (match.$or || []).concat([
        { qty: { $gt: 0 } },
        { quantity: { $gt: 0 } },
        { stock: { $gt: 0 } },
        { inStock: true },
      ])
    }

    // theme & series
    const themeFilter = buildThemeMatch(theme, series)
    Object.assign(match, themeFilter)

    // Count + fetch
    const [count, items] = await Promise.all([
      Product.countDocuments(match),
      Product.find(match)
        .sort({ name: 1, itemNo: 1 })
        .skip(skip)
        .limit(lim)
        .lean(),
    ])

    res.status(200).json({ count, items })
  } catch (err: any) {
    console.error('products_api_error', err)
    res.status(500).json({ error: 'products_api_error', message: err?.message || String(err) })
  }
}