import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    const coll = db.collection('products');

    const totals = {
      all: await coll.countDocuments(),
      minifig_all: await coll.countDocuments({ type: 'MINIFIG' }),
      minifig_qty_gt0: await coll.countDocuments({ type: 'MINIFIG', qty: { $gt: 0 } }),
    };

    const sample = await coll.findOne(
      {},
      { projection: { _id: 0, itemNo: 1, name: 1, type: 1, qty: 1, price: 1, themeKey: 1, seriesKey: 1, inventoryId: 1 } }
    );

    res.status(200).json({ ok: true, db: db.databaseName, totals, sample });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
