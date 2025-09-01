// src/pages/api/debug-products-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'

type Row = {
  collection: string
  total: number
  mfAll: number
  mfStock: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const db = mongoose.connection.db
    if (!db) {
      return res.status(500).json({ error: 'No DB handle from mongoose.connection.db' })
    }

    // list all collections whose name looks like products*
    const infos = await db.listCollections({ name: /products/i }).toArray()
    const names = infos.map(i => i.name).sort()

    const rows: Row[] = []
    for (const name of names) {
      const coll = db.collection(name)
      const [total, mfAll, mfStock] = await Promise.all([
        coll.countDocuments({}),
        coll.countDocuments({ type: 'MINIFIG' }),
        coll.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
      ])
      rows.push({ collection: name, total, mfAll, mfStock })
    }

    // show the collection currently configured, too
    const active = process. PAYPAL_CLIENT_SECRET_REDACTED|| '(unset)'

    rows.sort((a, b) =>
      (b.mfStock - a.mfStock) || (b.mfAll - a.mfAll) || (b.total - a.total)
    )

    res.status(200).json({
      activeCollection: active,
      rows,
      hint: 'Pick the collection whose mfStock ≈ your expected in-stock number, then set PRODUCTS_COLLECTION=<that> in .env.local and restart dev.',
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) })
  }
}