// src/pages/api/checkout/bank.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type Item = { sku: string; name: string; price: number; quantity: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const items: Item[] = Array.isArray(req.body?.items) ? req.body.items : []
  if (!items.length) return res.status(400).json({ error: 'No items' })

  const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0)

  const orderId = `K${Date.now().toString(36).toUpperCase()}`

  const bank = {
    name: process. PAYPAL_CLIENT_SECRET_REDACTED|| '',
    bsb: process.env.BANK_DEPOSIT_BSB || '',
    account: process. PAYPAL_CLIENT_SECRET_REDACTED|| '',
    referenceHint: process. PAYPAL_CLIENT_SECRET_REDACTED|| 'Use your order number as reference',
  }

  return res.status(200).json({
    orderId,
    total: Number(total.toFixed(2)),
    currency: 'AUD',
    payBy: 'bank',
    bank,
    message:
      'Please make a bank transfer using the details above. Your order will be held for 48 hours.',
  })
}