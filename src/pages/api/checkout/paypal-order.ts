// src/pages/api/checkout/paypal-order.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAccessToken } from '@/lib/paypal'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const token = await getAccessToken()
    // You would call PayPal API to create an order here
    res.status(200).json({ ok: true, token, orderId: 'FAKE_ORDER_ID' })
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
}