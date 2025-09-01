import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isPost = req.method === 'POST';
  const isGetConfirmed = req.method === 'GET' && (req.query.confirm === '1' || req.query.run === '1');

  if (!isPost && !isGetConfirmed) {
    return res.status(405).json({ ok:false, error:'Use POST, or GET with ?confirm=1' });
  }

  try {
    await dbConnect();
    const coll = mongoose.connection.db.collection('products');

    // Heuristics:
    //  - name mentions minifig/minifigure
    //  - common BL minifig prefixes (sw, hp, cty, njo, col, tlm, sh, bat, mar, jw, nin, ddm, cmf)
    //  - exclude sticker sheets (stk)
    //  - only docs without a defined type
    const result = await coll.updateMany(
      {
        $and: [
          { $or: [
            { name:   { $regex: /(minifig|minifigure)/i } },
            { itemNo: { $regex: /^(sw|hp|cty|njo|col|tlm|sh|bat|mar|jw|nin|ddm|cmf)[-_]?\d+/i } },
          ]},
          { itemNo: { $not: /stk/i } },
          { $or: [
            { type: { $exists: false } },
            { type: { $in: [null, ''] } },
          ]},
        ]
      },
      { $set: { type: 'MINIFIG' } }
    );

    res.status(200).json({ ok:true, matched: result.matchedCount, updated: result.modifiedCount });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
