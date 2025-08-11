import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Product from '../../models/Product'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const { type, limit: limitRaw, includeIncomplete } = req.query
    const limit = Math.min(parseInt(String(limitRaw ?? '48'), 10) || 48, 500)

    const showIncomplete = ['1', 'true', 'yes'].includes(String(includeIncomplete).toLowerCase())

    const filter: Record<string, any> = {}

    if (type) {
      filter.type = String(type).toUpperCase()
    }

    // 🔒 Ignore incomplete docs by default
    if (!showIncomplete) {
      Object.assign(filter, {
        inventoryId: { $gt: 0 },
        itemNo: { $exists: true, $ne: null },
        name: { $exists: true, $ne: null },
      })
    }

    const inventory = await Product.find(filter)
      .sort({ inventoryId: 1, _id: 1 })
      .limit(limit)
      .select({
        _id: 0, // keep JSON clean
        inventoryId: 1,
        type: 1,
        categoryId: 1,
        itemNo: 1,
        name: 1,
        condition: 1,
        description: 1,
        remarks: 1,
        price: 1,
        qty: 1,
        imageUrl: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean()

    return res.status(200).json({ success: true, inventory })
  } catch (err: any) {
    console.error('minifigs API error:', err)
    return res.status(500).json({ success: false, error: err?.message || 'Server error' })
  }
}