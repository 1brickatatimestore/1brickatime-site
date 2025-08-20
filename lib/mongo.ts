import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI as string | undefined;
const dbName = (process.env.MONGODB_DB as string | undefined) || 'lego';

if (!uri) {
  throw new Error('MONGODB_URI is not set');
}

type Cached = {
  client: MongoClient | null;
  db: Db | null;
};

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var __mongoCache: Cached | undefined;
}

const globalCache = globalThis as unknown as { __mongoCache?: Cached };

if (!globalCache.__mongoCache) {
  globalCache.__mongoCache = { client: null, db: null };
}

export async function getDb(): Promise<Db> {
  const cache = globalCache.__mongoCache!;
  if (cache.db) return cache.db;

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cache.client = client;
  cache.db = db;
  return db;
}