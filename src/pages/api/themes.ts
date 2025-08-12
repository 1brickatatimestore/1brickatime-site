import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'
import { extractPrefix, mapThemeKey, THEME_LABELS, ThemeKey } from '@/lib/theme-map'

type Opt = { key: string; label: string; count: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  const docs = await Product.find(
    { type: 'MINIFIG' },
    { _id: 0, itemNo: 1 }
  ).lean()

  const perPrefix = new Map<string, number>()
  for (const d of docs) {
    const pfx = extractPrefix(d.itemNo)
    perPrefix.set(pfx, (perPrefix.get(pfx) || 0) + 1)
  }

  const counts = new Map<ThemeKey, number>()
  for (const [pfx, c] of perPrefix.entries()) {
    const key = mapThemeKey(pfx)
    counts.set(key, (counts.get(key) || 0) + c)
  }

  // roll up singles (non-CMF) into "Other (Singles)"
  let singles = 0
  for (const [key, c] of [...counts.entries()]) {
    if (key !== 'collectible-minifigures' && key !== 'other' && c === 1) {
      counts.delete(key)
      singles += 1
    }
  }
  if (singles > 0) counts.set('other', (counts.get('other') || 0) + singles)

  const options: Opt[] = [...counts.entries()]
    .map(([key, count]) => ({ key, label: THEME_LABELS[key], count }))
    .sort((a, b) => a.label.localeCompare(b.label))

  res.status(200).json({ options })
}