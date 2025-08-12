import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import overrides from '@/lib/themeOverrides.json'

type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  condition?: string
  imageUrl?: string
  status?: string
  qty?: number
}

type Json = {
  count: number
  items: Item[]
  page: number
  limit: number
}

function normalizeLower(s?: string) {
  return (s || '').toString().toLowerCase()
}

function firstPrefix(itemNo?: string) {
  const id = (itemNo || '').toLowerCase()
  if (!id) return ''
  const letters = id.replace(/[^a-z0-9]/g, '')
  if (letters.length >= 3 && /\d/.test(letters[2])) return letters.slice(0, 3)
  return letters.slice(0, 3)
}

function mapTheme(itemNo?: string, name?: string) {
  const nx = firstPrefix(itemNo)
  const lowerName = normalizeLower(name)
  const mp: Record<string, string> = (overrides as any).mapPrefix || {}
  if (nx && mp[nx]) return mp[nx]
  const contains: Record<string, string> = (overrides as any).mapContains || {}
  for (const needle in contains) {
    if (lowerName.includes(needle)) return contains[needle]
  }
  return 'other'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json | any>) {
  try {
    await dbConnect()

    const type = (req.query.type as string) || 'MINIFIG'
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.max(1, Math.min(72, Number(req.query.limit ?? 36)))
    const q = (req.query.q as string) || ''
    const cond = (req.query.cond as string) || '' // '' | 'N' | 'U'
    const theme = (req.query.theme as string) || '' // '', 'other', 'star-wars', etc.
    const series = (req.query.series as string) || '' // e.g. '1','2',...
    const onlyInStock = String(req.query.onlyInStock ?? '1') !== '0'

    // Base DB filter (sellable + optional condition + text)
    const match: any = { type }

    if (cond === 'N') match.condition = 'N'
    if (cond === 'U') match.condition = 'U'

    if (onlyInStock) {
      match.qty = { $gt: 0 }
      match.$and = [
        ...(match.$and || []),
        {
          $or: [
            { status: { $exists: false } },
            { status: { $eq: '' } },
            { status: null },
            { status: { $not: /S/ } }, // remove Stockroom
          ],
        },
        {
          $or: [
            { status: { $exists: false } },
            { status: { $eq: '' } },
            { status: null },
            { status: { $not: /R/ } }, // remove Reserved
          ],
        },
      ]
    }

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      match.$or = [{ name: rx }, { itemNo: rx }]
    }

    // Pull all minimal fields we need to compute theme/series reliably,
    // then filter/paginate in memory (1685 docs is fine).
    const fields = {
      itemNo: 1,
      name: 1,
      price: 1,
      condition: 1,
      imageUrl: 1,
      inventoryId: 1,
      qty: 1,
      status: 1,
      createdAt: 1
    }

    const all = await Product.find(match, fields).sort({ createdAt: -1 }).lean<Item[]>()

    // Theme filter (uses same mapping as /api/themes)
    let filtered = all
    if (theme && theme !== '__ALL__') {
      filtered = filtered.filter(d => mapTheme(d.itemNo, d.name) === theme)
    }

    // Series filter (applies inside Collectible Minifigures)
    if (series) {
      const sn = String(series).trim()
      const rxSeries = new RegExp(`\\bSeries\\s*${sn}\\b`, 'i')
      filtered = filtered.filter(d => {
        const isCMF = mapTheme(d.itemNo, d.name) === 'collectible-minifigures'
        if (!isCMF) return false
        const nm = normalizeLower(d.name)
        return rxSeries.test(nm)
      })
    }

    const count = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)

    res.status(200).json({ count, items, page, limit })
  } catch (err: any) {
    console.error('products error', err)
    res.status(500).json({ error: 'fatal', message: err?.message || 'unknown' })
  }
}