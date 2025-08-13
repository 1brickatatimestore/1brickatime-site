import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/dbConnect'
import Product from '../../../models/Product'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect(process.env.MONGODB_URI!)
  const bad = await Product.find({
    $or: [{ status: 'S' }, { isStockroom: true }, { forSale: false }]
  })
    .select('itemNo name qty status isStockroom forSale')
    .limit(20)
    .lean()
  res.json({ sample: bad, note: 'This list is empty if your importer did not persist these flags.' })
}