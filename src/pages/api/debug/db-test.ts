import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "bricklink";
const collName = process. PAYPAL_CLIENT_SECRET_REDACTED|| process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig";

let _client: MongoClient | null = null;
async function client() {
  if (!_client) _client = new MongoClient(uri);
  if (!_client.topology) await _client.connect();
  return _client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!uri) throw new Error("MONGODB_URI missing");
    const c = await client();
    const db = c.db(dbName);
    const col = db.collection(collName);
    const total = await col.countDocuments();
    const sample = await col.findOne({}, { projection: { _id: 0 }, sort: { _id: -1 } });
    res.status(200).json({
      env: { dbName, collName, hasUri: !!uri },
      counts: { total },
      sampleFields: sample ? Object.keys(sample) : [],
    });
  } catch (e: any) {
    res.status(500).json({
      error: e?.message || String(e),
      env: { dbName, collName, hasUri: !!process.env.MONGODB_URI },
    });
  }
}