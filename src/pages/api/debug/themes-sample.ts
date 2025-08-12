import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'

const Product =
  mongoose.models.Product ||
  mongoose.model(
    'Product',
    new mongoose.Schema({}, { strict: false }),
    'products'
  )

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }

    const docs: any[] = await Product.find(
      { type: 'MINIFIG' },
      { theme: 1, Theme: 1, category: 1, Category: 1, subtheme: 1, subTheme: 1, categoryPath: 1, themePath: 1, path: 1, name: 1 }
    )
      .limit(50)
      .lean()
      .exec()

    const keys: Record<string, number> = {}
    for (const d of docs) {
      for (const k of Object.keys(d)) keys[k] = (keys[k] ?? 0) + 1
    }

    res.status(200).json({
      ok: true,
      seenKeys: keys,
      sample: docs.slice(0, 5),
    })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'error' })
  }
}