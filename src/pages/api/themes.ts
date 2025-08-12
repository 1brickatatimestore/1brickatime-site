import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import overrides from '@/lib/themeOverrides.json'

type Option = { key: string; label: string; count: number }
type Series = { key: string; label: string; count: number }

function normalizeLower(s?: string) {
  return (s || '').toString().toLowerCase()
}

function firstPrefix(itemNo?: string) {
  // e.g. "sw0187" -> "sw0", "hp123" -> "hp1", "cas022" -> "cas"
  const id = (itemNo || '').toLowerCase()
  if (!id) return ''
  const letters = id.replace(/[^a-z0-9]/g, '')
  if (letters.length >= 3 && /\d/.test(letters[2])) {
    return letters.slice(0, 3) // sw0, hp1, sc0, etc.
  }
  return letters.slice(0, 3) // cas, adv, etc.
}

function mapTheme(itemNo?: string, name?: string) {
  const nx = firstPrefix(itemNo)
  const lowerName = normalizeLower(name)

  // 1) prefix map
  const mp: Record<string, string> = (overrides as any).mapPrefix || {}
  if (nx && mp[nx]) return mp[nx]

  // 2) contains map
  const contains: Record<string, string> = (overrides as any).mapContains || {}
  for (const needle in contains) {
    if (lowerName.includes(needle)) return contains[needle]
  }

  return 'other'
}

function labelFor(key: string) {
  const labels: Record<string, string> = (overrides as any).labels || {}
  return labels[key] || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect()

    const type = (req.query.type as string) || 'MINIFIG'
    const cond = (req.query.cond as string) || '' // '' | 'N' | 'U'
    const onlyInStock = String(req.query.onlyInStock ?? '1') !== '0'

    // base sellable filter (shared with products API)
    const match: any = { type }

    if (cond === 'N') match.condition = 'N'
    if (cond === 'U') match.condition = 'U'

    if (onlyInStock) {
      match.qty = { $gt: 0 }
      // Exclude BL Stockroom/Reserved. If status missing, we let it pass.
      match.$and = [
        ...(match.$and || []),
        {
          $or: [
            { status: { $exists: false } },
            { status: { $eq: '' } },
            { status: null },
            { status: { $not: /S/ } }, // not stockroom
          ],
        },
        {
          $or: [
            { status: { $exists: false } },
            { status: { $eq: '' } },
            { status: null },
            { status: { $not: /R/ } }, // not reserved
          ],
        },
      ]
    }

    // Pull the minimal fields
    const docs = await Product.find(match, { itemNo: 1, name: 1 }).lean()

    // Count by theme
    const counts = new Map<string, number>()
    for (const d of docs) {
      const key = mapTheme(d.itemNo as any, d.name as any)
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    // Build options list with stable alphabetical order by label
    const allKeys = Array.from(counts.keys())
    // Always include "other" even if 0; also include any known labels from overrides
    const knownLabels: Record<string, string> = (overrides as any).labels || {}
    for (const k of Object.keys(knownLabels)) if (!counts.has(k)) counts.set(k, 0)
    if (!counts.has('other')) counts.set('other', 0)

    const options: Option[] = Array.from(counts.entries())
      .map(([key, count]) => ({ key, label: labelFor(key), count }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

    // Build CMF Series buckets (best-effort)
    const seriesMap = new Map<string, number>()
    for (const d of docs) {
      const key = mapTheme(d.itemNo as any, d.name as any)
      if (key !== 'collectible-minifigures') continue
      const nm = normalizeLower(d.name as any)
      const m = nm.match(/\bseries\s*(\d{1,2})\b/i)
      if (m) {
        const sn = m[1]
        seriesMap.set(sn, (seriesMap.get(sn) || 0) + 1)
      }
    }
    const series: Series[] = Array.from(seriesMap.entries())
      .map(([sn, count]) => ({ key: sn, label: `Series ${sn}`, count }))
      .sort((a, b) => Number(a.key) - Number(b.key))

    res.status(200).json({ options, series })
  } catch (err: any) {
    console.error('themes error', err)
    res.status(500).json({ error: 'fatal', message: err?.message || 'unknown' })
  }
}