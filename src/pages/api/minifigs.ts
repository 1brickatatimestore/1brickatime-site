import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/db'
import Product from '../../models/Product'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)

    // ---- query params ----
    const requestedType = (req.query.type as string) || 'MINIFIG'
    const showAllTypes  = requestedType.toUpperCase() === 'ALL'

    // page or skip + limit
    const limitRaw = (req.query.limit as string) || '36'
    let limit = Number.parseInt(limitRaw, 10)
    if (Number.isNaN(limit) || limit <= 0) limit = 36
    if (limit > 100) limit = 100 // cap to keep payloads sane

    const pageRaw = (req.query.page as string) || '1'
    let page = Number.parseInt(pageRaw, 10)
    if (Number.isNaN(page) || page <= 0) page = 1

    const skipParam = req.query.skip as string | undefined
    const skip = skipParam != null ? Math.max(0, Number.parseInt(skipParam, 10)) : (page - 1) * limit

    // hide incomplete rows unless explicitly asked
    const includeIncomplete = (req.query.includeIncomplete as string)?.toLowerCase() === '1'

    // ---- filter ----
    const filter: Record<string, any> = {}
    if (!showAllTypes) {
      filter.type = requestedType // default is MINIFIG
    }
    if (!includeIncomplete) {
      filter.inventoryId = { $exists: true, $ne: null }
      filter.name        = { $exists: true, $ne: null }
      // imageUrl is optional, but you can enforce it by uncommenting:
      // filter.imageUrl    = { $exists: true, $ne: '' }
    }

    // ---- query ----
    const [count, docs] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(
        filter,
        {
          // projection keeps payload small
          inventoryId: 1,
          type: 1,
          categoryId: 1,
          itemNo: 1,
          name: 1,
          condition: 1,
          description: 1,
          remarks: 1,
          price: 1,
          qty: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 0, // strip Mongo _id so JSON is clean
        }
      )
        .sort({ inventoryId: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ])

    return res.status(200).json({
      success: true,
      type: showAllTypes ? 'ALL' : requestedType,
      count,                 // total matching documents (not just this page)
      page,
      limit,
      skip,
      inventory: docs,
    })
  } catch (err: any) {
    console.error('minifigs api error:', err)
    return res.status(500).json({ success: false, error: err?.message || String(err) })
  }
}