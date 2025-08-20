import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

type Minifig = {
  _id?: any;
  figNumber?: string;
  name?: string;
  theme?: string;
  priceAUD?: number;
  qty?: number;
  image?: string;
  updatedAt?: string;
  [k: string]: any;
};

type Ok = { ok: true; count: number; items: Minifig[] };
type Err = { ok: false; error: string };

const getEnv = (k: string, fallback = '') =>
  (process.env[k] ?? fallback).toString().trim();

const parseIntSafe = (v: any, d: number) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  const uri = getEnv('MONGODB_URI');
  const dbName = getEnv('MONGODB_DB', 'bricklink');

  const primary = getEnv('MINIFIGS_COLLECTION', 'products_minifig');
  const fallback = getEnv('MINIFIGS_ENRICHED_COLLECTION', 'products_minifig_enriched');

  const limit = parseIntSafe(req.query.limit, 20);
  const theme = typeof req.query.theme === 'string' ? req.query.theme.trim() : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!uri) return res.status(500).json({ ok: false, error: 'MONGODB_URI missing' });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const baseFilter: Record<string, any> = {
      $or: [{ qty: { $gt: 0 } }, { qty: { $exists: false } }],
    };
    if (theme) baseFilter.theme = theme;

    const runQuery = async (collectionName: string) => {
      const col = db.collection<Minifig>(collectionName);
      if (q) {
        try {
          return await col.find({ ...baseFilter, $text: { $search: q } }).limit(limit).toArray();
        } catch {
          const regexOr = [
            { name: { $regex: q, $options: 'i' } },
            { figNumber: { $regex: q, $options: 'i' } },
            { theme: { $regex: q, $options: 'i' } },
          ];
          return await col.find({ ...baseFilter, $or: [...(baseFilter.$or || []), ...regexOr] }).limit(limit).toArray();
        }
      }
      return await col.find(baseFilter).limit(limit).toArray();
    };

    let items = await runQuery(primary);
    if (!items?.length) items = await runQuery(fallback);

    res.status(200).json({ ok: true, count: items?.length || 0, items: items || [] });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  } finally {
    await client.close().catch(() => {});
  }
}