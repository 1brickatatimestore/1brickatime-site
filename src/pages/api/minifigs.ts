// src/pages/api/minifigs.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'

type Item = any
type Json = { ok: true; count: number; inventory: Item[] } | { ok: false; error: string }

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function extractPrefix(itemNo?: string | null): string {
  const s = (itemNo || '').trim()
  const m = s.match(/^[a-z]+/i)
  return m ? m[0].toLowerCase() : ''
}

// Variants for each canonical parent (for searching both themeCode and itemNo prefix)
function parentVariants(code: string): string[] {
  const c = code.toLowerCase()
  if (c.startsWith('col')) return [c] // exact for CMF series

  if (c === 'sw')  return ['sw']
  if (c === 'sh')  return ['sh']
  if (c === 'hp')  return ['hp', 'hpt', 'hpo']
  if (c === 'ij')  return ['ij', 'iaj']
  if (c === 'jw')  return ['jw', 'jp']
  if (c === 'njo') return ['njo', 'nin', 'nps', 'nj'] // merge ALL ninjago-like
  if (c === 'toy') return ['toy']
  if (c === 'son') return ['son', 'sonic']

  return [c]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  try {
    await dbConnect()

    const {
      type = 'MINIFIG',
      limit = '36',
      page = '1',
      theme,          // single canonical code (e.g., 'hp', 'njo', or 'colXX')
      themes,         // comma-separated list
      inStock,
      q,
    } = req.query as Record<string, string>

    const per = Math.max(1, Math.min(200, parseInt(limit, 10) || 36))
    const pg  = Math.max(1, parseInt(page, 10) || 1)

    const where: Record<string, any> = { type }

    if (inStock === '1' || inStock === 'true') {
      where.qty = { $gt: 0 }
    }

    if (q && q.trim()) {
      where.$or = [
        { name:   { $regex: q.trim(), $options: 'i' } },
        { itemNo: { $regex: q.trim(), $options: 'i' } },
      ]
    }

    const ors: any[] = where.$or ? [...where.$or] : []

    const addThemeVariants = (code: string) => {
      const variants = parentVariants(code)
      // themeCode match OR itemNo prefix match
      ors.push({ themeCode: { $in: variants } })
      ors.push({
        $or: variants.map(v => ({ itemNo: { $regex: `^${escapeRegExp(v)}`, $options: 'i' } })),
      })
    }

    if (theme && theme.trim()) addThemeVariants(theme.trim().toLowerCase())

    if (themes && themes.trim()) {
      const list = themes.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      for (const c of list) addThemeVariants(c)
    }

    if (ors.length) where.$or = ors

    const [inventory, count] = await Promise.all([
      Product.find(where)
        .sort({ name: 1 })
        .skip((pg - 1) * per)
        .limit(per)
        .lean(),
      Product.countDocuments(where),
    ])

    return res.status(200).json({ ok: true, count, inventory })
  } catch (err: any) {
    console.error('minifigs api error', err)
    return res.status(500).json({ ok: false, error: err?.message || 'server error' })
  }
}