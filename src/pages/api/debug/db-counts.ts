import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;

    const defaultDbName = db.databaseName;
    const defaultProducts = await db.collection('products').countDocuments().catch(() => 0);

    // Also look explicitly at the "bricklink" DB in case your URI/database differs
    const blDb = db.client.db('bricklink');
    const blProducts = await blDb.collection('products').countDocuments().catch(() => 0);

    res.status(200).json({
      ok: true,
      defaultDb: defaultDbName,
      counts: {
        [`${defaultDbName}.products`]: defaultProducts,
        'bricklink.products': blProducts,
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
