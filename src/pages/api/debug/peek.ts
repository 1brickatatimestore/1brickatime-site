import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/dbConnect'
import Product from '../../../models/Product'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect(process.env.MONGODB_URI!)
    const sample = await Product.findOne({}).lean()
    const keys = sample ? Object.keys(sample) : []
    res.status(200).json({ ok: true, keys, sample })
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || String(e) })
  }
}