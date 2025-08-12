// src/pages/api/themes-other.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type Overrides = {
  mapContains?: Record<string, string>
  mapPrefix?: Record<string, string>
}

function loadOverrides(): Overrides {
  try {
    const p = path.join(process.cwd(), 'src', 'lib', 'themeOverrides.json')
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Overrides
  } catch {
    return {}
  }
}

const OV = loadOverrides()
const containsKeys = Object.keys(OV.mapContains ?? {}).sort((a, b) => b.length - a.length)

function mapTheme(name: string | undefined, itemNo: string | undefined): string {
  const n = (name ?? '').toLowerCase()
  for (const needle of containsKeys) {
    if (n.includes(needle)) return OV.mapContains![needle]
  }
  const p3 = (itemNo ?? '').toLowerCase().slice(0, 3)
  const pref = (OV.mapPrefix ?? {})[p3]
  return pref ?? 'other'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // optional filters to mirror the UI
    const cond = typeof req.query.cond === 'string' ? req.query.cond : ''
    const onlyInStock = req.query.onlyInStock === '1' || req.query.onlyInStock === 'true'

    const match: any = { type: 'MINIFIG' }
    if (cond) match.condition = cond
    if (onlyInStock) match.quantity = { $gt: 0 }

    // Scan the items that *remain* in "other" after mapping
    const cursor = Product.find(match, { _id: 0, name: 1, itemNo: 1 }).lean().cursor()

    const byPrefix = new Map<string, number>()
    let otherCount = 0

    for await (const doc of cursor as any) {
      const theme = mapTheme(doc.name, doc.itemNo)
      if (theme !== 'other') continue
      const p3 = (doc.itemNo ?? '').toLowerCase().slice(0, 3)
      byPrefix.set(p3, (byPrefix.get(p3) ?? 0) + 1)
      otherCount++
    }

    const topPrefixes = Array.from(byPrefix.entries()).sort((a, b) => b[1] - a[1])
    res.status(200).json({ ok: true, otherCount, topPrefixes })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'themes_other_failed', message: err?.message })
  }
}