// src/pages/api/checkout/paypal-capture.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAccessToken } from '@/lib/paypal'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessToken()
    res.status(200).json({ ok: true, token })
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
}