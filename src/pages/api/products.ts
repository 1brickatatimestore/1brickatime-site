import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import mongoose from 'mongoose'

type Json = {
  success: boolean
  message?: string
  indexes?: any[]
  droppedIndex?: string | null
  unsetModified?: number
  ensuredIndex?: string | null
  error?: any
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Json>
) {
  try {
    await dbConnect(process.env.MONGODB_URI!)
    const db = mongoose.connection.db
    const col = db.collection('products')

    // 1) List current indexes
    const indexes = await col.indexes()

    // 2) Drop any index that includes minifigId
    const minifigIdx = indexes.find(ix => ix.key && (ix.key as any).minifigId === 1)
    if (minifigIdx) {
      await col.dropIndex(minifigIdx.name)
    }

    // 3) Remove the minifigId field from all docs (cleanup)
    const unsetRes = await col.updateMany(
      { minifigId: { $exists: true } },
      { $unset: { minifigId: '' } }
    )

    // 4) Ensure we have a unique index on inventoryId (our new key)
    await col.createIndex({ inventoryId: 1 }, { unique: true })

    return res.status(200).json({
      success: true,
      message: 'Repaired products collection.',
      indexes,
      droppedIndex: minifigIdx?.name || null,
      unsetModified: unsetRes.modifiedCount,
      ensuredIndex: 'inventoryId_1',
    })
  } catch (err: any) {
    console.error('repair-products error:', err)
    return res.status(500).json({ success: false, error: err?.message || String(err) })
  }
}