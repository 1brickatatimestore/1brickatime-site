// src/pages/api/themes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Product from '../../models/Product'
import { normalizePrefix, ThemeMapEntry } from '../../lib/theme-map'

type Opt = { key: string; label: string; count: number }

// Extract leading letters from itemNo, e.g. "sw0262" -> "sw"
function getPrefix(itemNo?: string): string {
  if (!itemNo) return ''
  const m = itemNo.toLowerCase().match(/^[a-z]+/)
  return m ? m[0] : ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  // Only minifigs
  const docs = await Product.find({ type: 'MINIFIG' }, { itemNo: 1 }).lean()

  // Count per normalized key
  const tally = new Map<string, { entry: ThemeMapEntry; count: number }>()
  const singlesBucket = { key: 'other', label: 'Other (Singles)' }

  for (const d of docs) {
    const prefix = getPrefix(d.itemNo)
    const entry = normalizePrefix(prefix)
    const key = entry ? entry.key : `__unknown__:${prefix || 'none'}`
    const label = entry ? entry.label : 'Other (Singles)'

    const mapKey = entry ? key : '__other__'
    const prev = tally.get(mapKey)
    if (prev) prev.count += 1
    else tally.set(mapKey, { entry: entry ?? singlesBucket, count: 1 })
  }

  // Merge any normalized themes that have only 1 item into "Other (Singles)"
  let otherCount = 0
  const list: Opt[] = []
  for (const { entry, count } of tally.values()) {
    if (entry.key === 'other') { otherCount += count; continue }
    if (count === 1) otherCount += 1
    else list.push({ key: entry.key, label: entry.label, count })
  }
  if (otherCount > 0) {
    list.push({ key: 'other', label: 'Other (Singles)', count: otherCount })
  }

  // Sort alpha by label (your request)
  list.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

  res.json({ options: list })
}