// src/pages/api/debug-collections.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'

type Row = { collection: string; total: number; mfAll: number; mfStock: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const conn = await dbConnect(process.env.MONGODB_URI!)
    // Primary: use mongoose.connection.db
    let db = conn.connection.db

    // Fallback: derive from native client if needed
    if (!db) {
      const client: any = (conn.connection as any).getClient?.()
      if (client) db = client.db(process.env.MONGODB_DB || (conn.connection as any).name)
    }
    if (!db) {
      return res.status(500).json({ error: 'No Mongo DB connection (mongoose.connection.db missing)' })
    }

    const infos = await db.listCollections({}, { nameOnly: true }).toArray()
    const names: string[] = infos.map((i: any) => i.name as string).filter((n: string) => /products/i.test(n))

    const out: Row[] = []
    for (const n of names) {
      const coll = db.collection(n)
      const [total, mfAll, mfStock] = await Promise.all([
        coll.countDocuments({}),
        coll.countDocuments({ type: 'MINIFIG' }),
        coll.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
      ])
      out.push({ collection: n, total, mfAll, mfStock })
    }

    out.sort((a, b) => (b.mfStock - a.mfStock) || (b.mfAll - a.mfAll) || (b.total - a.total))
    res.status(200).json({ dbName: db.databaseName, results: out })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) })
  }
}