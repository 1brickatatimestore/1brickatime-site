import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import mongoose from 'mongoose'

type Json = {
  success: boolean
  message?: string
  droppedMinifigIdx?: string | null
  droppedInventoryIdx?: string | null
  unsetMinifigId?: number
  coercedInventoryIdToNumber?: number
  unsetInventoryIdBadValues?: number
  ensuredIndex?: string | null
  indexesBefore?: any[]
  indexesAfter?: any[]
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

    // List current indexes (before)
    const indexesBefore = await col.indexes()

    // 1) Drop any index on minifigId (old schema)
    const minifigIdx = indexesBefore.find(ix => ix.key && (ix.key as any).minifigId === 1)
    if (minifigIdx) {
      await col.dropIndex(minifigIdx.name)
    }

    // 2) Drop any existing inventoryId index; we'll recreate it with a safer partial filter
    const invIdx = indexesBefore.find(ix => ix.key && (ix.key as any).inventoryId === 1)
    if (invIdx) {
      try { await col.dropIndex(invIdx.name) } catch { /* ignore */ }
    }

    // 3) Remove the legacy field entirely if present
    const unsetMinifigRes = await col.updateMany(
      { minifigId: { $exists: true } },
      { $unset: { minifigId: '' } }
    )

    // 4) Coerce inventoryId strings -> numbers (server supports pipeline updates)
    let coerced = { modifiedCount: 0 }
    try {
      coerced = await col.updateMany(
        { inventoryId: { $type: 'string' } },
        [ { $set: { inventoryId: { $toInt: '$inventoryId' } } } ]
      )
    } catch {
      // If older engine blocks pipeline updates, skip; we’ll still guard with the partial filter below.
    }

    // 5) Unset bad inventoryId values so they don't collide with a unique index
    //    - nulls
    //    - non-numbers
    //    - numbers <= 0 (BrickLink IDs are positive)
    const unsetBad = await col.updateMany(
      {
        $or: [
          { inventoryId: null },
          { inventoryId: { $type: 'string' } },
          { inventoryId: { $type: 'object' } },
          { inventoryId: { $type: 'array' } },
          { inventoryId: { $type: 'bool' } },
          { inventoryId: { $type: 'double' }, inventoryId: { $lte: 0 } },
          { inventoryId: { $type: 'int' }, inventoryId: { $lte: 0 } },
          { inventoryId: { $type: 'long' }, inventoryId: { $lte: 0 } },
        ],
      },
      { $unset: { inventoryId: '' } }
    )

    // 6) Create UNIQUE index on inventoryId for positive numbers ONLY
    //    Use {$gt: 0} so we don't need $ne:null (which your server rejects in partial indexes)
    await col.createIndex(
      { inventoryId: 1 },
      {
        unique: true,
        partialFilterExpression: { inventoryId: { $gt: 0 } },
        name: 'inventoryId_1',
      }
    )

    const indexesAfter = await col.indexes()

    return res.status(200).json({
      success: true,
      message: 'Repaired products collection and indexes.',
      droppedMinifigIdx: minifigIdx?.name || null,
      droppedInventoryIdx: invIdx?.name || null,
      unsetMinifigId: unsetMinifigRes.modifiedCount,
      coercedInventoryIdToNumber: coerced.modifiedCount,
      unsetInventoryIdBadValues: unsetBad.modifiedCount,
      ensuredIndex: 'inventoryId_1 (unique, partial: {inventoryId: {$gt: 0}})',
      indexesBefore,
      indexesAfter,
    })
  } catch (err: any) {
    console.error('repair-products error:', err)
    return res
      .status(500)
      .json({ success: false, error: err?.message || String(err) })
  }
}