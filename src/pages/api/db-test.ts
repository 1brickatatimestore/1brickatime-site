// src/pages/api/db-stats.ts
export const runtime = 'nodejs'

import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  await dbConnect(process.env.MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) return res.status(500).json({ error: 'No Mongo DB connection (mongoose.db missing)' })

  const infos = await db.listCollections().toArray()
  const names = infos.map(i => i.name).filter(n => /products/i.test(n))

  const out = []
  for (const n of names) {
    const col = db.collection(n)
    const total   = await col.countDocuments()
    const mfAll   = await col.countDocuments({ type: 'MINIFIG' })
    const mfStock = await col.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } })
    out.push({ collection: n, total, mfAll, mfStock })
  }

  res.status(200).json({ dbName: db.databaseName, results: out })
}