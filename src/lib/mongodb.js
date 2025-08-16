// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  // fail early — helpful when Next starts and env isn't set
  throw new Error('MONGODB_URI environment variable is required. Export it in the shell before running.');
}

// reuse a single connection in dev to avoid pool exhaustion (Next hot-reloads)
if (!globalThis._mongoClientPromise) {
  const client = new MongoClient(uri);
  globalThis._mongoClientPromise = client.connect();
}

/**
 * Get the database instance (the DB from the connection string).
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
  const client = await globalThis._mongoClientPromise;
  return client.db();
}

/**
 * Get the products collection, using env override:
 *   PRODUCTS_COLLECTION (if set) else 'products'
 * @returns {Promise<import('mongodb').Collection>}
 */
export async function getProductsCollection() {
  const db = await getDb();
  const name = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products';
  return db.collection(name);
}