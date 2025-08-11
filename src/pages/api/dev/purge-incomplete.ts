import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import Product from '../../../models/Product'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // Count how many “incomplete” docs we have (no inventoryId OR no itemNo)
    const beforeCount = await Product.countDocuments({
      $or: [{ inventoryId: { $exists: false } }, { inventoryId: null }, { itemNo: { $in: [null, ''] } }],
    })

    // Delete them
    const delRes = await Product.deleteMany({
      $or: [{ inventoryId: { $exists: false } }, { inventoryId: null }, { itemNo: { $in: [null, ''] } }],
    })

    const totalAfter = await Product.countDocuments({})

    return res.status(200).json({
      success: true,
      removed: delRes.deletedCount || 0,
      incompleteBefore: beforeCount,
      totalAfter,
      note: 'Only removed docs missing inventoryId or itemNo. Your real BrickLink-synced docs remain.',
    })
  } catch (e: any) {
    console.error('purge-incomplete error:', e)
    return res.status(500).json({ success: false, error: e.message || e })
  }
}