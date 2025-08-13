import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

const PP_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com'

// Minimal PayPal token fetch
async function getPayPalToken() {
  const id = process.env.PAYPAL_CLIENT_ID || ''
  const secret = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
  const resp = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  if (!resp.ok) throw new Error(`paypal_token_failed ${resp.status}`)
  const json = await resp.json()
  return json.access_token as string
}

async function refundCapture(access: string, captureId: string) {
  const r = await fetch(`${PP_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  if (r.ok) return { ok: true, status: r.status, body: await r.json() }

  // Handle already-refunded idempotently
  const body = await r.json().catch(() => ({}))
  const name = body?.name
  const details = body?.details || []
  const already = name === 'UNPROCESSABLE_ENTITY' &&
                  details.some((d: any) => (d.issue || '').includes('CAPTURE_FULLY_REFUNDED'))

  if (already) return { ok: true, alreadyRefunded: true, status: r.status, body }
  return { ok: false, status: r.status, body }
}

type RestockItem = { inventoryId?: number; id?: string; qty: number }

async function restockItems(payloadItems: RestockItem[]) {
  await dbConnect(process.env.MONGODB_URI!)
  const results: any[] = []
  for (const it of payloadItems) {
    const qty = Number(it.qty)
    if (!qty || (!it.inventoryId && !it.id)) {
      results.push({ ok: false, reason: 'bad_item', item: it })
      continue
    }
    const q: any = it.inventoryId ? { inventoryId: it.inventoryId } : { _id: it.id }
    const upd = await Product.updateOne(q, { $inc: { qty } })
    results.push({ ok: upd.modifiedCount > 0, match: upd.matchedCount, modified: upd.modifiedCount, item: it })
  }
  return results
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const captureId = String(req.query.captureId || '').trim()
    const orderId = String(req.query.orderId || '').trim()
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const payloadItems: RestockItem[] = Array.isArray(body?.items) ? body.items : []

    if (!captureId && !orderId) {
      return res.status(422).json({ error: 'missing_id', message: 'Provide captureId or orderId' })
    }

    const access = await getPayPalToken()
    const ops: any = { refunded: [], alreadyRefunded: [], restocked: [] }

    if (captureId) {
      const rr = await refundCapture(access, captureId)
      if (!rr.ok) {
        return res.status(422).json({ error: 'refund_restock_failed', message: `${rr.body?.name || 'paypal_error'}:${rr.body?.details?.[0]?.issue || ''} (${rr.status})` })
      }
      if (rr.alreadyRefunded) ops.alreadyRefunded.push(captureId)
      else ops.refunded.push(captureId)
    }

    // If you later want orderId flow, look up captures and loop them here.
    // For now, restock only from client-provided items (since your site hasn’t saved orders yet).
    if (payloadItems.length) {
      const results = await restockItems(payloadItems)
      ops.restocked = results
    } else {
      // No items provided; we can’t restock anything locally without saved order line-items.
      ops.restocked = []
    }

    return res.json({ ok: true, ...ops })
  } catch (err: any) {
    return res.status(500).json({ error: 'refund_restock_failed', message: err?.message || String(err) })
  }
}