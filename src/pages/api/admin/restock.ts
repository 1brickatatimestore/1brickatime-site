import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

type RestockItem = {
  inventoryId?: number
  id?: string            // optional Mongo _id fallback
  qty: number            // positive to add, negative to remove
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth: Bearer ADMIN_TOKEN
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    await dbConnect(process.env.MONGODB_URI!)

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const items: RestockItem[] = Array.isArray(body?.items) ? body.items : (
      body?.inventoryId || body?.id ? [{ inventoryId: body.inventoryId, id: body.id, qty: Number(body.qty || 0) }] : []
    )

    if (!items.length) {
      return res.status(422).json({ error: 'invalid_payload', hint: 'Provide { items:[{inventoryId?, id?, qty}] }' })
    }

    const results: any[] = []
    for (const it of items) {
      const qty = Number(it.qty)
      if (!qty || (!it.inventoryId && !it.id)) {
        results.push({ ok: false, reason: 'bad_item', item: it })
        continue
      }

      const q: any = it.inventoryId ? { inventoryId: it.inventoryId } : { _id: it.id }
      const upd = await Product.updateOne(q, { $inc: { qty } })
      results.push({ ok: upd.modifiedCount > 0, match: upd.matchedCount, modified: upd.modifiedCount, item: it })
    }

    return res.json({ ok: true, results })
  } catch (err: any) {
    return res.status(500).json({ error: 'restock_failed', message: err?.message || String(err) })
  }
}