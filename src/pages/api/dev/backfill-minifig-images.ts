import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import Product from '../../../models/Product'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // For any MINIFIG with missing/blank imageUrl, set it from itemNo
    const result = await Product.updateMany(
      {
        type: 'MINIFIG',
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' },
        ],
        itemNo: { $exists: true, $ne: null, $ne: '' },
      },
      [
        {
          $set: {
            imageUrl: { $concat: ['https://img.bricklink.com/ItemImage/MN/0/', '$itemNo', '.png'] },
          },
        },
      ] as any // pipeline update
    )

    return res.status(200).json({ success: true, matched: result.matchedCount, modified: result.modifiedCount })
  } catch (e: any) {
    console.error('backfill-minifig-images error:', e)
    return res.status(500).json({ success: false, error: e.message || e })
  }
}