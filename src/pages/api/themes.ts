import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

/**
 * We compute live counts for themes + CMF series.
 * Counts respect: type=MINIFIG, cond=N|U, onlyInStock=1, q=search text (optional)
 *
 * Response:
 * {
 *   options: [{ key, label, count }...],  // theme options with counts
 *   series:  [{ n, key, label, count }...] // CMF series options with counts
 * }
 */

type Opt = { key: string; label: string; count: number }
type SeriesOpt = { n: number; key: string; label: string; count: number }

const THEMES_ORDER: { key: string; label: string; rx: RegExp[] }[] = [
  { key: 'adventurers',           label: 'Adventurers',           rx: [/adventurer/i] },
  { key: 'atlantis',              label: 'Atlantis',              rx: [/atlantis/i] },
  { key: 'castle',                label: 'Castle',                rx: [/castle|king|knight/i] },
  { key: 'city',                  label: 'City',                  rx: [/^cty|city/i] },
  { key: 'collectible-minifigures', label: 'Collectible Minifigures', rx: [/^col/i, /Series\s+\d+/i] },
  { key: 'ghostbusters',          label: 'Ghostbusters',          rx: [/ghostbusters?/i] },
  { key: 'harry-potter',          label: 'Harry Potter',          rx: [/harry\s*potter|hp\s*\d+/i] },
  { key: 'hidden-side',           label: 'Hidden Side',           rx: [/hidden\s*side/i] },
  { key: 'ideas',                 label: 'Ideas',                 rx: [/ideas/i] },
  { key: 'indiana-jones',         label: 'Indiana Jones',         rx: [/indiana\s*jones|ij\d+/i] },
  { key: 'jurassic-world',        label: 'Jurassic World',        rx: [/jurassic|jw\d+/i] },
  { key: 'legends-of-chima',      label: 'Legends of Chima',      rx: [/chima/i] },
  { key: 'lego-dimensions',       label: 'LEGO Dimensions',       rx: [/dimensions?/i] },
  { key: 'minions',               label: 'Minions',               rx: [/minions?/i] },
  { key: 'monster-fighters',      label: 'Monster Fighters',      rx: [/monster\s*fighters?/i] },
  { key: 'nexo-knights',          label: 'Nexo Knights',          rx: [/nexo\s*knights?/i] },
  { key: 'ninjago',               label: 'Ninjago',               rx: [/ninjago|njo/i] },
  { key: 'pirates',               label: 'Pirates',               rx: [/^pi|pirates(?!.*caribbean)/i] },
  { key: 'pirates-of-the-caribbean', label: 'Pirates of the Caribbean', rx: [/caribbean|potc/i] },
  { key: 'racers',                label: 'Racers',                rx: [/racers?/i] },
  { key: 'space',                 label: 'Space',                 rx: [/space(?!.*police)/i] },
  { key: 'speed-champions',       label: 'Speed Champions',       rx: [/speed\s*champions?/i] },
  { key: 'star-wars',             label: 'Star Wars',             rx: [/^sw|star\s*wars/i] },
  { key: 'the-lego-movie',        label: 'The LEGO Movie',        rx: [/lego\s*movie|tlm/i] },
  { key: 'the-simpsons',          label: 'The Simpsons',          rx: [/simpsons?/i] },
  { key: 'toy-story',             label: 'Toy Story',             rx: [/toy\s*story/i] },
  { key: 'trains',                label: 'Trains',                rx: [/trains?/i] },
  { key: 'ultra-agents',          label: 'Ultra Agents',          rx: [/ultra\s*agents?/i] },
  { key: 'vidiyo',                label: 'VIDIYO',                rx: [/vidiyo/i] },
  // Always keep "Other (Singles)" last
]

const OTHER_KEY = 'other'
const OTHER_LABEL = 'Other (Singles)'

function themeKeyFor(doc: any): string {
  const itemNo: string = String(doc.itemNo || '')
  const name: string = String(doc.name || '')
  for (const t of THEMES_ORDER) {
    if (t.rx.some(r => r.test(itemNo) || r.test(name))) return t.key
  }
  return OTHER_KEY
}

function themeLabelFromKey(key: string): string {
  const t = THEMES_ORDER.find(t => t.key === key)
  return t ? t.label : OTHER_LABEL
}

function extractSeriesNumber(doc: any): number | null {
  const name: string = String(doc.name || '')
  // "Series 7", "Series 20", etc.
  const m = name.match(/Series\s+(\d{1,3})/i)
  if (m) return Number(m[1])
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const { type = 'MINIFIG', cond, onlyInStock, q } = req.query as Record<string, string>
    const stock = onlyInStock === '1' || onlyInStock === 'true'

    const match: any = {}
    if (type) match.type = type
    if (cond === 'N' || cond === 'U') match.condition = cond
    if (stock) match.qty = { $gt: 0 }
    if (q && q.trim()) {
      match.$or = [
        { name:   { $regex: q.trim(), $options: 'i' } },
        { itemNo: { $regex: q.trim(), $options: 'i' } },
      ]
    }

    // Pull a lightweight projection so this stays quick.
    const docs = await Product.find(match, { name: 1, itemNo: 1, qty: 1 }).lean()

    // Theme counts
    const counts = new Map<string, number>()
    for (const d of docs) {
      const key = themeKeyFor(d)
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    // Build options in your preferred order (alphabetical, with “Other” last)
    const sortedKeys = [
      ...THEMES_ORDER.map(t => t.key),
      OTHER_KEY,
    ].filter((k, i, arr) => arr.indexOf(k) === i) // unique

    const options: Opt[] = []
    for (const key of sortedKeys) {
      const count = counts.get(key) || 0
      if (count > 0) {
        options.push({ key, label: themeLabelFromKey(key), count })
      }
    }

    // Series counts (only among CMF)
    const seriesMap = new Map<number, number>()
    for (const d of docs) {
      const key = themeKeyFor(d)
      if (key !== 'collectible-minifigures') continue
      const n = extractSeriesNumber(d)
      if (n != null) seriesMap.set(n, (seriesMap.get(n) || 0) + 1)
    }

    const series: SeriesOpt[] =
      Array.from(seriesMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([n, count]) => ({
          n,
          key: `series-${n}`,
          label: `Series ${n}`,
          count,
        }))

    // Always append the "Other (Singles)" option last if present in counts
    const otherCount = counts.get(OTHER_KEY) || 0
    if (!options.find(o => o.key === OTHER_KEY) && otherCount > 0) {
      options.push({ key: OTHER_KEY, label: OTHER_LABEL, count: otherCount })
    }

    res.status(200).json({ options, series })
  } catch (err: any) {
    console.error('themes endpoint failed:', err)
    res.status(500).json({ error: 'themes_failed', message: String(err?.message || err) })
  }
}