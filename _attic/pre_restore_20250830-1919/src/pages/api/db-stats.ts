import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

type Data =
  | { ok: true; db: string; usedCollection: string; counts: Record<string, number>; sample?: any }
  | { ok: false; error: string };

const getEnv = (k: string, fallback = '') =>
  (process.env[k] ?? fallback).toString().trim();

export default async function handler(_req: NextApiRequest, res: NextApiResponse<Data>) {
  const uri = getEnv('MONGODB_URI');
  const dbName = getEnv('MONGODB_DB', 'bricklink');

  const candidates = [
    getEnv('MINIFIGS_COLLECTION', ''),
    getEnv('MINIFIGS_ENRICHED_COLLECTION', ''),
    getEnv('PRODUCTS_COLLECTION', ''),
    'products_minifig',
    'products_minifig_enriched',
  ].filter(Boolean);

  if (!uri) return res.status(500).json({ ok: false, error: 'MONGODB_URI missing' });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const counts: Record<string, number> = {};
    let usedCollection = '';
    let sample: any;

    for (const name of candidates) {
      const col = db.collection(name);
      const total = await col.countDocuments({});
      counts[name] = total;
      if (!usedCollection && total > 0) {
        usedCollection = name;
        sample = await col.find({}).limit(1).toArray().then(r => r[0]);
      }
    }

    if (!usedCollection) usedCollection = getEnv('MINIFIGS_COLLECTION', 'products_minifig');

    res.status(200).json({ ok: true, db: dbName, usedCollection, counts, sample });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  } finally {
    await client.close().catch(() => {});
  }
}