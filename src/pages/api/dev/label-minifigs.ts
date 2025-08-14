import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Use POST' });
  try {
    await dbConnect();
    const coll = mongoose.connection.db.collection('products');

    // Heuristics:
    // - name mentions minifig/minifigure
    // - itemNo looks like common BL minifig codes (sw, hp, cty, njo, col, tlm, sh, bat, mar, jw, nin…)
    // - exclude anything with 'stk' (sticker sheets), and leave already-typed docs alone
    const result = await coll.updateMany(
      {
        $and: [
          { $or: [
            { name:   { $regex: /(minifig|minifigure)/i } },
            { itemNo: { $regex: /^(sw|hp|cty|njo|col|tlm|sh|bat|mar|jw|nin|ddm|cmf)[-_]?\d+/i } }
          ]},
          { itemNo: { $not: /stk/i } },
          { $or: [
            { type: { $exists: false } },
            { type: { $in: [null, ''] } }
          ]}
        ]
      },
      { $set: { type: 'MINIFIG' } }
    );

    res.status(200).json({ ok:true, matched: result.matchedCount, updated: result.modifiedCount });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
