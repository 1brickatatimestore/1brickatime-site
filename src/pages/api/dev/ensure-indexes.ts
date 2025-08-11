import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import Product from '../../../models/Product'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // keep unique by inventoryId
    await Product.collection.createIndex({ inventoryId: 1 }, { unique: true })

    // 🚀 speed up find({type}) + sort({inventoryId:1})
    const name = 'type_inventoryId_1'
    await Product.collection.createIndex({ type: 1, inventoryId: 1 }, { name })

    const idx = await Product.collection.indexes()
    res.status(200).json({ success: true, created: [name], indexes: idx })
  } catch (e: any) {
    console.error('ensure-indexes error:', e)
    res.status(500).json({ success: false, error: e.message || String(e) })
  }
}