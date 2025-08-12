import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'              // <-- if your file is dbConnect.ts, create db.ts that re-exports it
import Product from '../../models/Product'

type Option = { key: string; label: string; count: number }

/**
 * Map BrickLink-ish prefixes to our canonical “theme keys”.
 * Multiple prefixes can collapse to the same theme (your rule:
 * “collapse sub-themes into the main theme”).
 */
const PREFIX_TO_THEME: Record<string, { key: string; label: string }> = {
  // Big ones
  sw:   { key: 'star-wars',               label: 'Star Wars' },
  hp:   { key: 'harry-potter',            label: 'Harry Potter' },
  njo:  { key: 'ninjago',                 label: 'Ninjago' },
  ninjago: { key: 'ninjago',              label: 'Ninjago' },
  jw:   { key: 'jurassic-world',          label: 'Jurassic World' },
  tlm:  { key: 'the-lego-movie',          label: 'The LEGO Movie' },

  // City / Town family
  cty:  { key: 'city',                    label: 'City' },
  twn:  { key: 'city',                    label: 'City' },
  air:  { key: 'city',                    label: 'City' }, // airport subline – fold into City
  cop:  { key: 'city',                    label: 'City' }, // police subline – fold into City

  // Other named lines seen in your data/debug
  sc:   { key: 'speed-champions',         label: 'Speed Champions' },
  sp:   { key: 'space',                   label: 'Space' },
  trn:  { key: 'trains',                  label: 'Trains' },
  poc:  { key: 'pirates-of-the-caribbean',label: 'Pirates of the Caribbean' },
  pi:   { key: 'pirates',                 label: 'Pirates' },
  gs:   { key: 'ghostbusters',            label: 'Ghostbusters' },
  sim:  { key: 'the-simpsons',            label: 'The Simpsons' },
  toy:  { key: 'toy-story',               label: 'Toy Story' },
  bob:  { key: 'spongebob-squarepants',   label: 'SpongeBob SquarePants' },
  hs:   { key: 'hidden-side',             label: 'Hidden Side' },
  iaj:  { key: 'indiana-jones',           label: 'Indiana Jones' },
  loc:  { key: 'legends-of-chima',        label: 'Legends of Chima' },
  uagt: { key: 'ultra-agents',            label: 'Ultra Agents' },
  nex:  { key: 'nexo-knights',            label: 'Nexo Knights' },
  atl:  { key: 'atlantis',                label: 'Atlantis' },
  vid:  { key: 'vidiyo',                  label: 'VIDIYO' },
  min:  { key: 'minions',                 label: 'Minions' },
  idea: { key: 'ideas',                   label: 'Ideas' },
  rac:  { key: 'racers',                  label: 'Racers' },
  mof:  { key: 'monster-fighters',        label: 'Monster Fighters' },
  dim:  { key: 'lego-dimensions',         label: 'LEGO Dimensions' },
  cas:  { key: 'castle',                  label: 'Castle' },
  adv:  { key: 'adventurers',             label: 'Adventurers' },
  adp:  { key: 'adventurers',             label: 'Adventurers' },

  // Some BrickHeadz/Generic catch-alls people sometimes have (guarded)
  gen:  { key: 'other',                   label: 'Other (Singles)' }, // generic/unknown → will be re-bucketed anyway
}

/** CMF named sub-series codes commonly found in inventories */
const CMF_NAMED: Record<string, string> = {
  ma:  'Marvel',
  dc:  'DC',
  hp:  'Harry Potter',
  dis: 'Disney',
  tl:  'The LEGO Movie',
  tlm: 'The LEGO Movie',
  mu:  'Muppets',
  lo:  'Looney Tunes',
  nin: 'Ninjago',
  sim: 'The Simpsons',
}

/** classify a single itemNo into either a theme or CMF series */
function classify(itemNo: string) {
  const s = (itemNo || '').toLowerCase()

  // CMF (Collectible Minifigures) always start with 'col'
  if (s.startsWith('col')) {
    // Try numeric series e.g. col001, col010, col20...
    const mNum = s.match(/^col0*([0-9]+)/)
    if (mNum) {
      const n = mNum[1].replace(/^0+/, '') || '0'
      return { themeKey: 'collectible-minifigures', seriesKey: `cmf-series-${n}`, seriesLabel: `Collectible Minifigures — Series ${n}` }
    }

    // Named CMF lines like colma (Marvel), colhp (Harry Potter), coltl (TLM)
    const mNamed = s.match(/^col([a-z]+)/)
    if (mNamed) {
      const code = mNamed[1]
      // collapse known aliases (e.g., 'tl' / 'tlm' both → TLM)
      let name = CMF_NAMED[code] || code.toUpperCase()
      return { themeKey: 'collectible-minifigures', seriesKey: `cmf-series-${code}`, seriesLabel: `Collectible Minifigures — ${name}` }
    }

    // Default CMF bucket
    return { themeKey: 'collectible-minifigures' }
  }

  // Non-CMF: pick letters until a digit
  const m = s.match(/^[a-z]+/)
  const prefix = m ? m[0] : ''
  if (prefix && PREFIX_TO_THEME[prefix]) {
    const t = PREFIX_TO_THEME[prefix]
    return { themeKey: t.key }
  }

  // Unknown → will likely end up in Others based on your rule
  return { themeKey: 'other' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  // We only need itemNo for building theme counts
  const rows = await Product.find({ type: 'MINIFIG' }).select({ itemNo: 1 }).lean()

  const counts = new Map<string, { label: string; count: number }>()
  const cmfSeries = new Map<string, { label: string; count: number }>()
  let cmfTotal = 0

  const bump = (key: string, label: string, map: Map<string, { label: string; count: number }>) => {
    const v = map.get(key)
    if (v) v.count++
    else map.set(key, { label, count: 1 })
  }

  for (const r of rows) {
    const it = (r as any).itemNo || ''
    const { themeKey, seriesKey, seriesLabel } = classify(it)

    if (themeKey === 'collectible-minifigures') {
      cmfTotal++
      if (seriesKey && seriesLabel) bump(seriesKey, seriesLabel, cmfSeries)
      continue
    }

    // Resolve final label for this themeKey
    let label = ''
    for (const k in PREFIX_TO_THEME) {
      if (PREFIX_TO_THEME[k].key === themeKey) { label = PREFIX_TO_THEME[k].label; break }
    }
    if (!label) label = themeKey === 'other' ? 'Other (Singles)' : themeKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    bump(themeKey, label, counts)
  }

  // Apply your rule: any theme with only 1 figure → bundle into “Other (Singles)”
  let otherSingles = 0
  const finalThemes: Option[] = []
  for (const [key, v] of counts.entries()) {
    if (key === 'other') { otherSingles += v.count; continue }
    if (v.count <= 1) { otherSingles += v.count; continue }
    finalThemes.push({ key, label: v.label, count: v.count })
  }
  if (otherSingles > 0) {
    finalThemes.push({ key: 'other', label: 'Other (Singles)', count: otherSingles })
  }

  // Add the top-level CMF theme (sum of all CMF items)
  if (cmfTotal > 0) {
    finalThemes.push({ key: 'collectible-minifigures', label: 'Collectible Minifigures', count: cmfTotal })
  }

  // Flatten series as additional options (so UI can show a second dropdown)
  const seriesOptions: Option[] = []
  for (const [key, v] of cmfSeries.entries()) {
    seriesOptions.push({ key, label: v.label, count: v.count })
  }

  // Sort alphabetically by label (Collectibles can sit in the C’s naturally).
  const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label)
  finalThemes.sort(byLabel)
  seriesOptions.sort(byLabel)

  return res.status(200).json({ options: finalThemes, series: seriesOptions })
}