// src/pages/api/dv-test.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'

type Row = {
  _id?: any
  itemNo?: string
  inventoryId?: number
  type?: string
  qty?: number
  price?: number
  name?: string
  imageUrl?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)
    const dbName = process.env.MONGODB_DB || 'bricklink'
    const collName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products'
    const db = mongoose.connection.useDb(dbName)
    const coll = db.collection<Row>(collName)

    // quick totals
    const [total, mfAll, mfStock] = await Promise.all([
      coll.countDocuments({}),
      coll.countDocuments({ type: 'MINIFIG' }),
      coll.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
    ])

    // distinct type histogram
    const types = await coll.aggregate([
      { $group: { _id: '$type', c: { $sum: 1 } } },
      { $sort: { c: -1 } },
    ]).toArray()

    // missing or empty key fields (that would break cards)
    const missingName = await coll.countDocuments({ type: 'MINIFIG', $or: [{ name: { $exists: false } }, { name: '' }] })
    const missingImage = await coll.countDocuments({ type: 'MINIFIG', $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }] })
    const qtyNotNumeric = await coll.countDocuments({ type: 'MINIFIG', qty: { $type: 'string' } })

    // duplicates (by inventoryId or itemNo)
    const dupInventoryId = await coll.aggregate([
      { $match: { inventoryId: { $ne: null } } },
      { $group: { _id: '$inventoryId', c: { $sum: 1 } } },
      { $match: { c: { $gt: 1 } } },
      { $limit: 20 },
    ]).toArray()

    const dupItemNo = await coll.aggregate([
      { $match: { itemNo: { $type: 'string' } } },
      { $group: { _id: '$itemNo', c: { $sum: 1 } } },
      { $match: { c: { $gt: 1 } } },
      { $limit: 20 },
    ]).toArray()

    // few sample docs to eyeball
    const samples = await coll.find({ type: 'MINIFIG' })
      .project({ _id: 1, itemNo: 1, name: 1, price: 1, qty: 1, imageUrl: 1 })
      .limit(3)
      .toArray()

    res.status(200).json({
      ok: true,
      dbName,
      collection: collName,
      counts: { total, mfAll, mfStock },
      typeHistogram: types,
      dataQuality: {
        missingName,
        missingImage,
        qtyNotNumeric,
        dupInventoryId,
        dupItemNo,
      },
      samples,
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
}