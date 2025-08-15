import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/db'
import Product from '../../../models/Product'
import { sniffTheme } from '@/lib/theme-map'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })
  await dbConnect()

  const cursor = (Product as any).find({ type: 'MINIFIG' }).cursor()
  let updated = 0

  for await (const doc of cursor as any) {
    const { code, label } = sniffTheme(doc.itemNo)
    // only write when missing or changed
    if (doc.themeCode !== code || doc.themeLabel !== label) {
      doc.themeCode = code
      doc.themeLabel = label
      await doc.save()
      updated++
    }
  }

  res.json({ ok: true, updated })
}