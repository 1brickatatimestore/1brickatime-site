// src/pages/api/db-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)
    const dbName = process.env.MONGODB_DB || 'bricklink'
    const db = mongoose.connection.useDb(dbName)

    const active = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products'
    const candidates = Array.from(new Set([
      active,
      'products',
      'products_predeploy_20250816T203840Z',
      'products_minifig',
      'products_minifig_enriched',
    ]))

    const results = await Promise.all(
      candidates.map(async (coll) => {
        const c = db.collection(coll)
        const [total, mfAll, mfStock] = await Promise.all([
          c.countDocuments({}),
          c.countDocuments({ type: 'MINIFIG' }),
          c.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
        ])
        return { collection: coll, total, mfAll, mfStock }
      })
    )

    res.status(200).json({
      ok: true,
      dbName,
      activeCollection: active,
      productsCollectionEnv: active,
      results,
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
}