// src/pages/api/themes.ts
export const runtime = 'nodejs'

import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import themeOverrides from '@/lib/themeOverrides.json'

function bucketsFromOverrides() {
  const keys = new Set<string>()
  Object.values(themeOverrides.mapPrefix || {}).forEach(k => keys.add(k))
  Object.values(themeOverrides.mapContains || {}).forEach(k => keys.add(k))
  keys.add('other')
  return Array.from(keys)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect(process.env.MONGODB_URI!)
  const type = (req.query.type as string) || 'MINIFIG'
  const includeSoldOut = String(req.query.includeSoldOut || '') === 'true'

  const stockMatch = includeSoldOut ? {} : { qty: { $gt: 0 } }
  const match: any = { type, ...stockMatch }

  // naive counts using itemNo prefixes via $regex OR names (approximate)
  const labels = themeOverrides.labels || {}
  const buckets = bucketsFromOverrides()

  const results: any[] = []
  for (const key of buckets) {
    if (key === 'other') continue // handle after
    const ors: any[] = []
    for (const [prefix, k] of Object.entries(themeOverrides.mapPrefix || {})) {
      if (k === key) ors.push({ itemNo: { $regex: `^${prefix}`, $options: 'i' } })
    }
    for (const [frag, k] of Object.entries(themeOverrides.mapContains || {})) {
      if (k === key) {
        const esc = frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ors.push({ name: { $regex: esc, $options: 'i' } })
      }
    }
    const c = await Product.countDocuments({ ...match, ...(ors.length ? { $or: ors } : { _id: { $exists: false } }) })
    results.push({ key, label: labels[key] || key, count: c })
  }

  // "other" = not matching any of the known buckets
  const excludeOrs: any[] = []
  for (const key of buckets.filter(k => k !== 'other')) {
    const ors: any[] = []
    for (const [prefix, k] of Object.entries(themeOverrides.mapPrefix || {})) {
      if (k === key) ors.push({ itemNo: { $regex: `^${prefix}`, $options: 'i' } })
    }
    for (const [frag, k] of Object.entries(themeOverrides.mapContains || {})) {
      if (k === key) {
        const esc = frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ors.push({ name: { $regex: esc, $options: 'i' } })
      }
    }
    if (ors.length) excludeOrs.push({ $or: ors })
  }
  const otherMatch = excludeOrs.length ? { $nor: excludeOrs } : {}
  const otherCount = await Product.countDocuments({ ...match, ...otherMatch })
  results.push({ key: 'other', label: labels['other'] || 'Other', count: otherCount })

  // sort by label for display
  results.sort((a, b) => a.label.localeCompare(b.label, 'en'))

  res.status(200).json({ items: results })
}