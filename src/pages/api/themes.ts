<<<<<<< HEAD
<<<<<<< HEAD
// src/pages/api/themes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import {
  mongoAddFieldsTheme,
  mongoAddFieldsSeries,
  mongoAddFieldsCollection,
} from "@/lib/minifig-taxonomy";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.MONGODB_DB || "bricklink";
const COLL_PRODUCTS = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products";

let _client: Promise<MongoClient> | null = null;
function getClient() {
  if (!_client) _client = new MongoClient(MONGODB_URI).connect();
  return _client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now();
  try {
    const client = await getClient();
    const db = client.db(DB_NAME);
    const col = db.collection(COLL_PRODUCTS);

    const type = String(req.query.type || "MINIFIG").toUpperCase();

    const pipeline = [
      { $match: { type } },
      { $addFields: { _theme: mongoAddFieldsTheme() as any } },
      { $addFields: { _series: mongoAddFieldsSeries() as any, _collection: mongoAddFieldsCollection() as any } },
      {
        $facet: {
          themes: [
            { $group: { _id: "$_theme", count: { $sum: 1 } } },
            { $project: { _id: 0, theme: "$_id", count: 1 } },
            { $sort: { count: -1, theme: 1 } },
            { $limit: 300 },
          ],
          collections: [
            { $group: { _id: "$_collection", count: { $sum: 1 } } },
            { $project: { _id: 0, collection: "$_id", count: 1 } },
            { $sort: { count: -1, collection: 1 } },
            { $limit: 200 },
          ],
          series: [
            { $match: { _series: { $ne: "" } } },
            { $group: { _id: "$_series", count: { $sum: 1 } } },
            { $project: { _id: 0, series: "$_id", count: 1 } },
            { $sort: { series: 1 } },
          ],
        },
      },
      { $project: { themes: 1, collections: 1, series: 1 } },
    ];

    const [f] = await col.aggregate(pipeline).toArray();
    return res.status(200).json({ options: f?.themes ?? [], collections: f?.collections ?? [], series: f?.series ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: "products_facets_unavailable", detail: JSON.stringify({ error: err?.message, elapsedMs: Date.now() - started }) });
=======
=======
// src/pages/api/themes.ts
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
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

<<<<<<< HEAD
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
>>>>>>> 03f49cd (Stable: themes page fixed, images good, layout locked)
=======
  // Merge any normalized themes that have only 1 item into "Other (Singles)"
  let otherCount = 0
  const list: Opt[] = []
  for (const { entry, count } of tally.values()) {
    if (entry.key === 'other') { otherCount += count; continue }
    if (count === 1) otherCount += 1
    else list.push({ key: entry.key, label: entry.label, count })
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
  }
  if (otherCount > 0) {
    list.push({ key: 'other', label: 'Other (Singles)', count: otherCount })
  }

  // Sort alpha by label (your request)
  list.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

  res.json({ options: list })
}