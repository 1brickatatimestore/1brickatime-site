import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type Option = { key: string; label: string; count: number }
type Series = { key: string; label: string; count: number }

type Overrides = {
  mapExact?: Record<string, string>;
  mapContains?: Record<string, string>;
  mapPrefix?: Record<string, string>;
};

function loadOverrides(): Overrides {
  try {
    const p = path.join(process.cwd(), 'src', 'lib', 'themeOverrides.json')
    const raw = fs.readFileSync(p, 'utf8')
    const json = JSON.parse(raw)
    return json || {}
  } catch {
    return {}
  }
}

// Dropdown labels (kept the way you liked)
const LABELS: Record<string, string> = {
  'adventurers': 'Adventurers',
  'atlantis': 'Atlantis',
  'castle': 'Castle',
  'city': 'City',
  'collectible-minifigures': 'Collectible Minifigures',
  'ghostbusters': 'Ghostbusters',
  'harry-potter': 'Harry Potter',
  'hidden-side': 'Hidden Side',
  'ideas': 'Ideas',
  'indiana-jones': 'Indiana Jones',
  'jurassic-world': 'Jurassic World',
  'legends-of-chima': 'Legends of Chima',
  'lego-dimensions': 'LEGO Dimensions',
  'minions': 'Minions',
  'monster-fighters': 'Monster Fighters',
  'nexo-knights': 'Nexo Knights',
  'ninjago': 'Ninjago',
  'pirates': 'Pirates',
  'pirates-of-the-caribbean': 'Pirates of the Caribbean',
  'racers': 'Racers',
  'space': 'Space',
  'speed-champions': 'Speed Champions',
  'spongebob-squarepants': 'SpongeBob SquarePants',
  'star-wars': 'Star Wars',
  'the-lego-movie': 'The LEGO Movie',
  'the-simpsons': 'The Simpsons',
  'toy-story': 'Toy Story',
  'trains': 'Trains',
  'ultra-agents': 'Ultra Agents',
  'vidiyo': 'VIDIYO',
  'other': 'Other (Singles)'
}

const ORDER = [
  'adventurers','atlantis','castle','city','collectible-minifigures','ghostbusters','harry-potter',
  'hidden-side','ideas','indiana-jones','jurassic-world','legends-of-chima','lego-dimensions','minions',
  'monster-fighters','nexo-knights','ninjago','pirates','pirates-of-the-caribbean','racers','space',
  'speed-champions','spongebob-squarepants','star-wars','the-lego-movie','the-simpsons','toy-story',
  'trains','ultra-agents','vidiyo','other',
]

const SYNONYMS: Record<string,string> = {
  'collectable minifigures': 'collectible-minifigures',
  'collectable minifigure': 'collectible-minifigures',
  'collectible minifigure': 'collectible-minifigures',
  'lego dimensions': 'lego-dimensions',
  'lego movie': 'the-lego-movie',
  'the lego movie 2': 'the-lego-movie',
  'harry potter': 'harry-potter',
  'jurassic world': 'jurassic-world',
  'indiana jones': 'indiana-jones',
  'legends of chima': 'legends-of-chima',
  'monster fighters': 'monster-fighters',
  'nexo knights': 'nexo-knights',
  'spongebob squarepants': 'spongebob-squarepants',
  'speed champions': 'speed-champions',
  'star wars': 'star-wars',
  'the simpsons': 'the-simpsons',
  'toy story': 'toy-story'
}

const PREFIX_MAP: Array<[RegExp, string]> = [
  [/^col/i, 'collectible-minifigures'],
  [/^cty/i, 'city'],
  [/^sw/i,  'star-wars'],
  [/^hp/i,  'harry-potter'],
  [/^jw/i,  'jurassic-world'],
  [/^(nj|njo)/i,'ninjago'],
  [/^sc/i,  'speed-champions'],
  [/^tlm2?/i,'the-lego-movie'],
  [/^tlbm/i,'the-lego-movie'],
  [/^sim/i, 'the-simpsons'],
  [/^loc/i, 'legends-of-chima'],
  [/^hs/i,  'hidden-side'],
  [/^gb/i,  'ghostbusters'],
  [/^ij|^ind/i, 'indiana-jones'],
  [/^poc/i,'pirates-of-the-caribbean'],
  [/^pi(?!x)/i, 'pirates'],
  [/^rac/i, 'racers'],
  [/^sp(?!d)/i, 'space'],
  [/^trn/i, 'trains'],
  [/^adv/i, 'adventurers'],
  [/^atl/i, 'atlantis'],
  [/^uagt|^ua/i, 'ultra-agents'],
  [/^dim/i, 'lego-dimensions'],
  [/^vid/i, 'vidiyo'],
  [/^min/i, 'minions'],
]

function rawThemeFromDoc(d: any): string {
  const candidates = [
    d.theme, d.themeName, d.theme_name, d.Theme,
    d.themeSlug, d.theme_slug, d.themeNormalized,
    d.category, d.categoryName, d.category_slug,
    d.group, d.parentTheme, d.seriesTheme,
    d.subtheme, d.subTheme,
  ]
  for (const v of candidates) if (typeof v === 'string' && v.trim()) return v
  if (typeof d.itemNo === 'string' && /^col/i.test(d.itemNo)) return 'Collectible Minifigures'
  if (typeof d.name === 'string' && /collectible/i.test(d.name)) return 'Collectible Minifigures'
  return ''
}

function normalizeFreeText(t?: string): string {
  const raw = (t || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (SYNONYMS[lower]) return SYNONYMS[lower]
  const slug = lower.replace(/\u00AE|\u2122/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  if (LABELS[slug]) return slug
  if (lower.includes('star wars')) return 'star-wars'
  if (lower.includes('harry potter')) return 'harry-potter'
  if (lower.includes('jurassic')) return 'jurassic-world'
  if (lower.includes('indiana jones')) return 'indiana-jones'
  if (lower.includes('ninjago')) return 'ninjago'
  if (lower.includes('city')) return 'city'
  if (lower.includes('castle')) return 'castle'
  if (lower.includes('pirates of the caribbean')) return 'pirates-of-the-caribbean'
  if (lower.includes('pirates')) return 'pirates'
  if (lower.includes('space')) return 'space'
  if (lower.includes('speed champions')) return 'speed-champions'
  if (lower.includes('spongebob')) return 'spongebob-squarepants'
  if (lower.includes('simpsons')) return 'the-simpsons'
  if (lower.includes('toy story')) return 'toy-story'
  if (lower.includes('ideas')) return 'ideas'
  if (lower.includes('collectible')) return 'collectible-minifigures'
  return ''
}

function fromPrefix(itemNo?: string): string {
  const code = (itemNo || '').trim()
  if (!code) return ''
  for (const [re, slug] of PREFIX_MAP) if (re.test(code)) return slug
  return ''
}

function getSeries(itemNo?: string, name?: string): number | null {
  const a = /col(\d{1,2})/i.exec(itemNo || '')
  if (a) return Number(a[1])
  const b = /series\s+(\d{1,2})\b/i.exec(name || '')
  if (b) return Number(b[1])
  return null
}

function applyOverrides(over: Overrides, doc: any): string {
  const name = (doc?.name || '').toString().toLowerCase()
  const themeRaw = (rawThemeFromDoc(doc) || '').toString().toLowerCase()
  const itemNo = (doc?.itemNo || '').toString()

  // exact theme text → slug
  const ex = over.mapExact || {}
  if (themeRaw && ex[themeRaw]) return ex[themeRaw]

  // contains in name/theme → slug
  const mc = over.mapContains || {}
  for (const key of Object.keys(mc)) {
    const k = key.toLowerCase()
    if (k && (name.includes(k) || themeRaw.includes(k))) return mc[key]
  }

  // prefix regex on itemNo → slug
  const mp = over.mapPrefix || {}
  for (const key of Object.keys(mp)) {
    try {
      const re = new RegExp(key, 'i')
      if (re.test(itemNo)) return mp[key]
    } catch {/* ignore bad regex */}
  }

  return ''
}

function classifyTheme(doc: any, over: Overrides): string {
  // 0) user overrides win
  const ov = applyOverrides(over, doc)
  if (ov) return ov

  // 1) explicit fields
  const free = normalizeFreeText(rawThemeFromDoc(doc))
  if (free) return free

  // 2) BL code prefix
  const pref = fromPrefix(doc.itemNo)
  if (pref) return pref

  // 3) name heuristics
  const name = normalizeFreeText(doc.name)
  if (name) return name

  return 'other'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    const overrides = loadOverrides()

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const cond = typeof req.query.cond === 'string' ? req.query.cond.trim().toUpperCase() : ''
    const onlyInStock = String(req.query.onlyInStock || '0') === '1'
    const type = typeof req.query.type === 'string' ? req.query.type : undefined

    const find: any = {}
    if (type) find.type = type

    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      find.$or = [{ name: re }, { itemNo: re }]
    }
    if (cond === 'N' || cond === 'U') find.condition = cond
    if (onlyInStock) {
      find.$or = [
        ...(find.$or || []),
        { qty: { $gt: 0 } },
        { stock: { $gt: 0 } },
      ]
    }

    const docs = await Product.find(find, {
      itemNo: 1, name: 1,
      theme: 1, themeName: 1, theme_name: 1, Theme: 1,
      themeSlug: 1, theme_slug: 1, themeNormalized: 1,
      category: 1, categoryName: 1, category_slug: 1,
      group: 1, parentTheme: 1, seriesTheme: 1,
      subtheme: 1, subTheme: 1,
    }).lean()

    const counts: Record<string, number> = {}
    const seriesCounts: Record<number, number> = {}

    for (const d of docs) {
      const slug = classifyTheme(d, overrides)

      if (slug === 'collectible-minifigures') {
        counts[slug] = (counts[slug] || 0) + 1
        const s = getSeries(d.itemNo as string, d.name as string)
        if (s && s >= 1 && s <= 26) seriesCounts[s] = (seriesCounts[s] || 0) + 1
      } else {
        counts[slug] = (counts[slug] || 0) + 1
      }
    }

    // Keep your “2+ stays; 1 → Other” rule
    for (const [k, c] of Object.entries(counts)) {
      if (k !== 'collectible-minifigures' && k !== 'other' && c < 2) {
        counts['other'] = (counts['other'] || 0) + c
        delete counts[k]
      }
    }

    const options: Option[] = ORDER
      .filter(k => (counts[k] || 0) > 0)
      .map(k => ({ key: k, label: LABELS[k], count: counts[k] }))

    const series: Series[] = Object.keys(seriesCounts)
      .map(Number).sort((a,b)=>a-b)
      .map(n => ({ key: String(n), label: `Series ${n}`, count: seriesCounts[n] }))

    res.status(200).json({ options, series, updatedAt: new Date().toISOString() })
  } catch (err: any) {
    console.error('themes api failed:', err)
    res.status(500).json({ error: 'themes_failed', message: err?.message || String(err) })
  }
}