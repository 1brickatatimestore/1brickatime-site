// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Product from '../../models/Product'
import { THEME_MAP, normalizePrefix, isCollectiblePrefix } from '../../lib/theme-map'

type Json = {
  count: number
  inventory: any[]
}

function buildThemeFilter(theme?: string) {
  if (!theme) return null

  // Collectible Minifigures: any itemNo starting with "col"
  if (theme === 'collectible-minifigures') {
    return { itemNo: { $regex: /^col/i } }
  }

  // Gather all source prefixes that map to this normalized key
  const wantedPrefixes = Object.keys(THEME_MAP).filter(
    (pref) => normalizePrefix(pref)?.key === theme
  )

  if (wantedPrefixes.length === 0) {
    if (theme === 'other') {
      // "Other (Singles)" = anything that doesn't map to a known theme or collectible
      // We approximate by excluding known prefixes.
      const known = Object.keys(THEME_MAP)
      return {
        $and: [
          { itemNo: { $not: /^col/i } },
          {
            $nor: known.map((p) => ({ itemNo: new RegExp(`^${p}`, 'i') })),
          },
        ],
      }
    }
    return null
  }

  // Build an $or of regexes: ^sw|^hp|...
  const ors = wantedPrefixes.map((p) => ({ itemNo: new RegExp(`^${p}`, 'i') }))
  return { $or: ors }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  await dbConnect()

  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.min(120, Math.max(1, Number(req.query.limit || 36)))
  const inStock = req.query.inStock === '1' || req.query.inStock === 'true'
  const theme = typeof req.query.theme === 'string' ? req.query.theme : undefined

  const query: any = { type: 'MINIFIG' }
  if (inStock) query.qty = { $gt: 0 }

  const themeFilter = buildThemeFilter(theme)
  if (themeFilter) Object.assign(query, themeFilter)

  const [count, inventory] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort({ name: 1, itemNo: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ])

  res.json({ count, inventory })
}