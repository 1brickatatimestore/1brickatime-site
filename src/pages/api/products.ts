import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'
import { extractPrefix, mapThemeKey, ThemeKey } from '@/lib/theme-map'

type Item = {
  _id?: string
  inventoryId?: number
  type?: string
  itemNo?: string
  name?: string
  condition?: string
  price?: number
  qty?: number
  imageUrl?: string
}

type Json = {
  count: number
  page: number
  limit: number
  items: Item[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  await dbConnect()

  const {
    type = 'MINIFIG',
    page = '1',
    limit = '36',
    theme,
    q = '',
    condition,
    priceMin,
    priceMax,
  } = req.query as Record<string, string>

  const p = Math.max(1, parseInt(String(page), 10) || 1)
  const lim = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 36))

  const docs: Item[] = await Product.find(
    { type },
    { _id: 1, inventoryId: 1, itemNo: 1, name: 1, condition: 1, price: 1, qty: 1, imageUrl: 1 }
  )
    .sort({ updatedAt: -1 })
    .lean()

  let items = docs

  if (theme && theme.length) {
    const tKey = theme as ThemeKey
    items = items.filter(d => mapThemeKey(extractPrefix(d.itemNo)) === tKey)
  }

  const query = q.trim().toLowerCase()
  if (query) {
    items = items.filter(d => {
      const name = (d.name || '').toLowerCase()
      const no = (d.itemNo || '').toLowerCase()
      return name.includes(query) || no.includes(query)
    })
  }

  if (condition === 'N' || condition === 'U') {
    items = items.filter(d => (d.condition || '').toUpperCase() === condition.toUpperCase())
  }

  const min = priceMin ? Number(priceMin) : undefined
  const max = priceMax ? Number(priceMax) : undefined
  if (Number.isFinite(min as number)) items = items.filter(d => Number(d.price || 0) >= (min as number))
  if (Number.isFinite(max as number)) items = items.filter(d => Number(d.price || 0) <= (max as number))

  const count = items.length
  const start = (p - 1) * lim
  const paged = items.slice(start, start + lim)

  res.status(200).json({ count, page: p, limit: lim, items: paged })
}