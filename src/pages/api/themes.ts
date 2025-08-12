import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'

type ThemeOpt = { key: string; label: string; count: number }
type Resp = { options: ThemeOpt[]; total: number; error?: string }

/** Map BrickLink-style minifig itemNo prefixes → main theme names */
const CODE_TO_THEME: Record<string, string> = {
  // Big ones
  cty: 'City', twn: 'City', city: 'City',
  sw: 'Star Wars',
  hp: 'Harry Potter',
  njo: 'Ninjago', nj: 'Ninjago',
  jw: 'Jurassic World', jwl: 'Jurassic World',
  tlm: 'The LEGO Movie', tlm2: 'The LEGO Movie',
  sp: 'Space',  // (generic space bucket)
  sc: 'Speed Champions',
  cas: 'Castle',
  jwj: 'Jurassic World',
  loc: 'Legends of Chima',
  uagt: 'Ultra Agents',
  dim: 'LEGO Dimensions',
  bob: 'SpongeBob SquarePants',
  sim: 'The Simpsons',
  tmnt: 'Teenage Mutant Ninja Turtles', tnt: 'Teenage Mutant Ninja Turtles',
  ind: 'Indiana Jones', iaj: 'Indiana Jones',
  rac: 'Racers',
  pi: 'Pirates',
  poc: 'Pirates of the Caribbean',
  trn: 'Trains',
  vid: 'VIDIYO',
  mk: 'Monkie Kid',
  min: 'Minions',
  adp: 'Adventurers',
  hs: 'Hidden Side',
  gs: 'Ghostbusters',
  tnr: 'Trains',
  air: 'City',
  // Collectible Minifigures
  col: 'Collectible Minifigures',
  coltl: 'Collectible Minifigures',
  colma: 'Collectible Minifigures',
  colhp: 'Collectible Minifigures',
  colsw: 'Collectible Minifigures',
  // Add more as you encounter them
}

function normalizeName(raw?: string): string {
  const s = (raw || '').trim()
  if (!s) return ''
  // Unify common spellings
  if (/^city$/i.test(s) || /^town$/i.test(s)) return 'City'
  if (/^star\s*wars$/i.test(s) || /^sw$/i.test(s)) return 'Star Wars'
  if (/^harry\s*potter$/i.test(s) || /^hp$/i.test(s)) return 'Harry Potter'
  if (/^speed\s*champ/i.test(s)) return 'Speed Champions'
  if (/^lego\s*movie/i.test(s) || /^tlm/i.test(s)) return 'The LEGO Movie'
  if (/^legends?\s*of\s*chima/i.test(s)) return 'Legends of Chima'
  if (/^ninjago$/i.test(s)) return 'Ninjago'
  if (/^collectible/i.test(s)) return 'Collectible Minifigures'
  return s.replace(/\s+/g, ' ').trim()
}

function themeFromItemNo(itemNo?: string): string {
  const s = (itemNo || '').toLowerCase()
  const m = s.match(/^[a-z]+/)
  if (!m) return ''
  const code = m[0]
  // try 4,3,2 letter windows (e.g., tlm2, njo, sw)
  for (const len of [4, 3, 2]) {
    const key = code.slice(0, len)
    if (CODE_TO_THEME[key]) return CODE_TO_THEME[key]
  }
  return ''
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  try {
    await dbConnect()

    const inStockOnly =
      req.query.inStock === '1' || (req.query.inStock as string) === 'true'

    const find: Record<string, any> = { type: 'MINIFIG' }
    if (inStockOnly) find.qty = { $gt: 0 }

    // Read minimal fields; compute theme defensively per doc
    const docs = await Product.find(find, { theme: 1, itemNo: 1 }, { lean: true })

    const counts = new Map<string, number>()

    for (const d of docs) {
      // Preferred: stored theme
      let theme = normalizeName((d as any).theme)
      // Fallback: derive from itemNo
      if (!theme) theme = themeFromItemNo((d as any).itemNo)
      // Default: -- leave empty; we'll bucket to Other Singles later
      theme = normalizeName(theme)

      // If still empty, stash as its own single (we’ll aggregate after)
      const key = theme || `__single__${(d as any).itemNo || Math.random()}`
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    // Merge everything that’s the same theme name (case/space-insensitive)
    const merged = new Map<string, ThemeOpt>()
    for (const [k, c] of counts) {
      if (k.startsWith('__single__')) continue
      const norm = k.toLowerCase()
      const prev = merged.get(norm)
      if (prev) prev.count += c
      else merged.set(norm, { key: norm.replace(/\s+/g, '-'), label: k, count: c })
    }

    // Count singles (items that still had no theme)
    const singles = Array.from(counts.entries()).filter(([k]) =>
      k.startsWith('__single__')
    ).length

    const out: ThemeOpt[] = Array.from(merged.values())

    // If *everything* was singletons (what you’re seeing now), we do NOT want to
    // show a useless “Other (Singles) — 1685” only. Instead, try to bucket by
    // itemNo-based themes again; if after that we still have 0 buckets, just show “All Minifigs”.
    if (out.length === 0 && singles > 0) {
      // Try a coarse bucket using itemNo prefixes already done above — nothing else to do here.
      // Fall back to “All Minifigs” with the total so the dropdown isn’t empty.
      return res.status(200).json({
        options: [{ key: '', label: 'All Minifigs', count: docs.length }],
        total: docs.length,
      })
    }

    if (singles > 0) {
      out.unshift({ key: 'other', label: 'Other (Singles)', count: singles })
    }

    out.sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label))
    const total = docs.length
    return res.status(200).json({ options: out, total })
  } catch (e: any) {
    return res
      .status(200)
      .json({ options: [], total: 0, error: String(e?.message || e) })
  }
}