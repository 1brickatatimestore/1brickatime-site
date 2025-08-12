import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Product from '../../models/Product'

type Json = {
  count: number
  items: any[]
}

type ThemeKey = string

// Keep this exactly in-sync with /api/themes.ts
const THEME_TO_PREFIXES: Record<ThemeKey, string[]> = {
  'star-wars': ['sw'],
  'harry-potter': ['hp'],
  'ninjago': ['njo', 'ninjago'],
  'jurassic-world': ['jw'],
  'the-lego-movie': ['tlm'],
  city: ['cty', 'twn', 'air', 'cop'],
  'speed-champions': ['sc'],
  space: ['sp'],
  trains: ['trn'],
  pirates: ['pi'],
  'pirates-of-the-caribbean': ['poc'],
  ghostbusters: ['gs'],
  'the-simpsons': ['sim'],
  'toy-story': ['toy'],
  'spongebob-squarepants': ['bob'],
  'hidden-side': ['hs'],
  'indiana-jones': ['iaj'],
  'legends-of-chima': ['loc'],
  'ultra-agents': ['uagt'],
  'nexo-knights': ['nex'],
  atlantis: ['atl'],
  vidiyo: ['vid'],
  minions: ['min'],
  ideas: ['idea'],
  racers: ['rac'],
  'monster-fighters': ['mof'],
  'lego-dimensions': ['dim'],
  castle: ['cas'],
  adventurers: ['adv', 'adp'],
  other: [], // handled separately
}

function buildThemeRegexes(theme?: string) {
  if (!theme || theme === '__ALL__') return null
  if (theme === 'collectible-minifigures') return [/^col/i]

  const prefixes = THEME_TO_PREFIXES[theme]
  if (!prefixes || prefixes.length === 0) {
    return null
  }
  return prefixes.map(p => new RegExp(`^${p}`, 'i'))
}

function buildSeriesRegex(series?: string) {
  if (!series) return null
  // numeric: cmf-series-# (UI) or just the number
  const s = String(series).replace(/^cmf-series-/, '')
  if (/^\d+$/.test(s)) {
    // col01, col001 … allow any 0-padded numeric
    return new RegExp(`^col0*${s}`, 'i')
  }
  // named like 'marvel', 'hp', 'tlm' etc.
  const code = s.replace(/[^a-z]/gi, '').toLowerCase()
  if (!code) return null
  return new RegExp(`^col${code}`, 'i')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json | { error: string }>) {
  await dbConnect()

  const {
    type = 'MINIFIG',
    q = '',
    cond = '',
    page = '1',
    limit = '36',
    theme = '__ALL__',
    series = '',
  } = req.query as Record<string, string>

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.max(1, Math.min(72, Number(limit) || 36))
  const skip = (pageNum - 1) * limitNum

  const filter: any = { type }

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { itemNo: rx }]
  }

  if (cond === 'N' || cond === 'U') {
    filter.condition = cond
  }

  // Theme filtering
  const themeRegexes = buildThemeRegexes(theme)
  if (themeRegexes) {
    filter.$or = filter.$or || []
    filter.$or.push(...themeRegexes.map(r => ({ itemNo: r })))
  }

  // Series filtering (only meaningful for CMF)
  const seriesRx = buildSeriesRegex(series)
  if (seriesRx) {
    filter.itemNo = seriesRx
  }

  const [items, count] = await Promise.all([
    Product.find(filter)
      .sort({ name: 1, itemNo: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec(),
    Product.countDocuments(filter),
  ])

  // Make dates and numbers JSON-safe & consistent
  const safeItems = items.map((d: any) => ({
    _id: String(d._id),
    inventoryId: d.inventoryId ?? null,
    type: d.type ?? 'MINIFIG',
    categoryId: d.categoryId ?? null,
    itemNo: d.itemNo ?? '',
    name: d.name ?? '',
    condition: d.condition ?? '',
    description: d.description ?? '',
    remarks: d.remarks ?? '',
    price: Number(d.price ?? 0),
    qty: Number(d.qty ?? 0),
    imageUrl: d.imageUrl ?? '',
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
  }))

  res.status(200).json({ count, items: safeItems })
}