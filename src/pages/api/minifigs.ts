import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'

type Json = any

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  try {
    // Cache: 60s browser, 5m SWR (works locally and on Vercel)
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

    await dbConnect(process.env.MONGODB_URI!)

    const {
      type = 'MINIFIG',
      limit: limitRaw,
      skip: skipRaw,
      showAllTypes,
      q,
    } = req.query

    const limit = Math.min(Math.max(parseInt(String(limitRaw || '36'), 10) || 36, 1), 1000)
    const skip  = Math.max(parseInt(String(skipRaw || '0'), 10) || 0, 0)

    const filter: Record<string, any> = {}
    if (!showAllTypes) filter.type = String(type || 'MINIFIG')

    // Hide incomplete rows by default
    filter.itemNo   = { $ne: null }
    filter.name     = { $ne: null }
    filter.imageUrl = { $ne: null }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i')
      filter.$or = [
        { name: rx },
        { itemNo: rx },
        { remarks: rx },
        { description: rx },
      ]
    }

    const [items, count] = await Promise.all([
      Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ])

    // keep payload small
    const inventory = items.map(i => ({
      _id:         i._id,
      inventoryId: i.inventoryId ?? null,
      type:        i.type ?? null,
      categoryId:  i.categoryId ?? null,
      itemNo:      i.itemNo ?? null,
      name:        i.name ?? null,
      condition:   i.condition ?? null,
      description: i.description ?? null,
      remarks:     i.remarks ?? null,
      price:       i.price ?? null,
      qty:         i.qty ?? 0,
      imageUrl:    i.imageUrl ?? null,
      createdAt:   i.createdAt ?? null,
      updatedAt:   i.updatedAt ?? null,
    }))

    res.status(200).json({ count, limit, skip, inventory })
  } catch (err: any) {
    console.error('minifigs API error:', err)
    res.status(500).json({ error: err?.message || 'Internal error' })
  }
}