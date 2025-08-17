// src/pages/api/sync/bricklink.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import { fetchAllMinifigInventories, minifigToImageUrl } from '@/lib/bricklink'

type Summary = {
  scanned: number
  kept: number
  upserts: number
  skipped_stockroom: number
  skipped_zero_qty: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // quick ping for wiring checks
  if (req.query.ping === '1') {
    return res.status(200).json({ ok: true, hello: 'sync endpoint alive' })
  }

  try {
    const key = req.query.key as string | undefined
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    await dbConnect(process.env.MONGODB_URI!)
    const activeDb = (mongoose.connection as any)?.name as string | undefined

    const required = ['BL_KEY','BL_SECRET','BL_TOKEN','BL_TOKEN_SECRET']
    for (const k of required) {
      if (!process.env[k]) return res.status(500).json({ error: `Missing env: ${k}` })
    }

    const raw = await fetchAllMinifigInventories({
      BL_KEY: process.env.BL_KEY!,
      BL_SECRET: process.env.BL_SECRET!,
      BL_TOKEN: process.env.BL_TOKEN!,
      BL_TOKEN_SECRET: process.env.BL_TOKEN_SECRET!,
      BL_USER_ID: process.env.BL_USER_ID,
    })

    const summary: Summary = {
      scanned: raw.length,
      kept: 0,
      upserts: 0,
      skipped_stockroom: 0,
      skipped_zero_qty: 0,
    }

    const keepIds: number[] = []

    for (const inv of raw) {
      if (inv.stock_room_id) { summary.skipped_stockroom++; continue }
      if (!inv.quantity || Number(inv.quantity) <= 0) { summary.skipped_zero_qty++; continue }

      summary.kept++
      keepIds.push(inv.inventory_id)

      const doc = {
        itemNo: inv.item?.no,
        inventoryId: inv.inventory_id,
        name: inv.item?.name ?? inv.description ?? '',
        type: 'MINIFIG' as const,
        condition: inv.new_or_used === 'N' ? 'N' : 'U',
        remarks: inv.remarks ?? '',
        language: 'en',
        price: Number(inv.unit_price) || 0,
        qty: Number(inv.quantity) || 0,
        imageUrl: inv.item?.no ? minifigToImageUrl(inv.item.no) : undefined,
      }

      const r = await Product.updateOne(
        { inventoryId: inv.inventory_id },
        { $set: doc },
        { upsert: true }
      )
      if ((r.upsertedCount ?? 0) > 0 || (r.modifiedCount ?? 0) > 0) summary.upserts++
    }

    if (String(req.query.prune) === '1') {
      await Product.deleteMany({
        type: 'MINIFIG',
        inventoryId: { $nin: keepIds },
      })
    }

    const inStock = await Product.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } })
    const allMinifigs = await Product.countDocuments({ type: 'MINIFIG' })

    res.status(200).json({
      ok: true,
      db: activeDb,
      collection: process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products',
      summary,
      counts: { inStock, allMinifigs },
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'sync failed' })
  }
}