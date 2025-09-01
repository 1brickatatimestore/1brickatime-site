// src/pages/api/db-test.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const dbName = process.env.MONGODB_DB || 'bricklink'
    const collName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products'
    const db = mongoose.connection.useDb(dbName)
    const coll = db.collection(collName)

    const [total, mfAll, mfStock] = await Promise.all([
      coll.countDocuments({}),
      coll.countDocuments({ type: 'MINIFIG' }),
      coll.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
    ])

    // grab one representative record to verify fields UI expects
    const sample =
      (await coll.find({ type: 'MINIFIG', qty: { $gt: 0 } })
        .project({ _id: 1, itemNo: 1, name: 1, price: 1, qty: 1, imageUrl: 1 })
        .limit(1)
        .toArray())[0] || null

    res.status(200).json({
      ok: true,
      mongoReadyState: mongoose.connection.readyState, // 1 = connected
      dbName,
      collection: collName,
      counts: { total, mfAll, mfStock },
      sample,
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
}