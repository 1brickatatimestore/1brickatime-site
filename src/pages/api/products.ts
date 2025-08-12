// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next'
// If your tsconfig has paths for "@/*", keep this:
import dbConnect from '@/lib/db'
import Product from '@/models/Product'

// If the alias "@" is NOT set up for you, swap the import above to:
// import dbConnect from '../../lib/db'
// import Product from '../../models/Product'

type Json =
  | { ok: true; items: any[]; total: number; page: number; limit: number }
  | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Json>
) {
  try {
    await dbConnect()

    const {
      type,
      theme,          // optional theme code (e.g., "sw" for Star Wars)
      q,              // search text
      inStock,        // "1" | "true" to filter qty > 0
      page = '1',
      limit = '36',
    } = req.query as Record<string, string>

    const where: Record<string, any> = {}

    if (type) where.type = type
    if (theme) where.themeCode = theme
    if (inStock === '1' || inStock === 'true') where.qty = { $gt: 0 }
    if (q && q.trim()) {
      where.$or = [
        { name:   { $regex: q.trim(), $options: 'i' } },
        { itemNo: { $regex: q.trim(), $options: 'i' } },
      ]
    }

    const per = Math.max(1, Math.min(200, parseInt(limit, 10) || 36))
    const pg  = Math.max(1, parseInt(page, 10) || 1)

    const [items, total] = await Promise.all([
      Product.find(where)
        .sort({ name: 1 })
        .skip((pg - 1) * per)
        .limit(per)
        .lean(),
      Product.countDocuments(where),
    ])

    res.status(200).json({ ok: true, items, total, page: pg, limit: per })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ ok: false, error: err?.message ?? 'server error' })
  }
}