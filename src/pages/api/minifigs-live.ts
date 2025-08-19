// src/pages/api/minifigs-live.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db } from 'mongodb';

type Minifig = {
  _id: string;
  id?: string;
  name?: string;
  price?: number;
  qty?: number;
  img?: string;
  tags?: string[];
  [k: string]: unknown;
};

type Data =
  | { ok: true; count: number; items: Minifig[] }
  | { ok: false; error: string };

const getEnv = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

// --- minimal Mongo cached client (avoids multiple connections on Vercel) ---
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const uri = getEnv('MONGODB_URI');
  const dbName = getEnv('MONGODB_DB');
  const client = cachedClient ?? new MongoClient(uri);
  cachedClient = client;
  if (!client.topology) {
    await client.connect();
  }
  cachedDb = client.db(dbName);
  return cachedDb!;
}

// --- helpers ---
const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v != null ? [String(v)] : [];

const asBool = (v: unknown): boolean => {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
};

const asNumber = (v: unknown, def: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // Safely read query params
    const limit = Math.min(Math.max(asNumber(req.query.limit, 24), 1), 100);
    const search = (req.query.search ?? '').toString().trim();
    const themes = asArray(req.query.theme);        // supports ?theme=Star%20Wars&theme=City
    const tags = asArray(req.query.tags);           // supports ?tags=foo&tags=bar
    const inStock = asBool(req.query.inStock);
    const priceMin = Number.isFinite(Number(req.query.priceMin)) ? Number(req.query.priceMin) : undefined;
    const priceMax = Number.isFinite(Number(req.query.priceMax)) ? Number(req.query.priceMax) : undefined;

    // Build Mongo filter
    const filter: Record<string, any> = {};

    if (search) {
      // If you don't have a text index, you can fall back to a regex on name
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }
    if (themes.length) {
      // assumes field "theme" or "themeName"; adjust if yours is different
      filter.$or = [
        ...(filter.$or ?? []),
        { theme: { $in: themes } },
        { themeName: { $in: themes } },
      ];
    }
    if (tags.length) {
      filter.tags = { $all: tags };
    }
    if (inStock) {
      filter.qty = { $gt: 0 };
    }
    if (priceMin != null || priceMax != null) {
      filter.price = {};
      if (priceMin != null) filter.price.$gte = priceMin;
      if (priceMax != null) filter.price.$lte = priceMax;
    }

    // Choose collection: prefer enriched if set
    const enriched = process.env.MINIFIGS_ENRICHED_COLLECTION;
    const fallback = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products_minifig';
    const collName = enriched && enriched.trim().length > 0 ? enriched : fallback;

    const db = await getDb();
    const pipeline: any[] = [
      { $match: filter },
      // Optional shaping / sorting; change to your fields
      { $sort: { qty: -1, price: 1, name: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          price: 1,
          qty: 1,
          img: 1,
          tags: 1,
          theme: 1,
          themeName: 1,
        },
      },
    ];

    const items = (await db.collection(collName).aggregate(pipeline).toArray()) as Minifig[];

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    console.error('minifigs-live error:', err?.stack || err?.message || err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || 'Internal Server Error' });
  }
}