import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/dbConnect'
import Product from '../../../models/Product'

function rxSeries(n: string) {
  const num = String(n).trim()
  return new RegExp(String.raw`(?:^|\s)Series\s*${num}\b`, 'i')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect(process.env.MONGODB_URI!)
  const s = String(req.query.s || '1')
  const docs = await Product.find(
    { type: 'MINIFIG', name: rxSeries(s) },
    'itemNo name price qty'
  )
    .limit(10)
    .lean()
  res.json({ sample: docs, series: s })
}