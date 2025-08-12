// src/pages/api/checkout/paypal-cancel.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple redirect or message on PayPal cancellation
  res.status(200).json({ ok: true, message: 'PayPal checkout cancelled' })
}