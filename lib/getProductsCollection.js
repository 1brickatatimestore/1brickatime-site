// lib/getProductsCollection.js
// Full helper: returns a native MongoDB Collection object for use in API routes.
// Behavior:
//  - Reads MONGODB_URI from env (must be exported in the runtime environment).
//  - Reuses one MongoClient instance across calls (simple singleton).
//  - Allows overriding collection name via env PRODUCTS_COLLECTION. If not set, falls back to 'products'.
//  - Throws clear errors if MONGODB_URI is missing.

const { MongoClient } = require('mongodb');

let _client = null;
let _clientPromise = null;

/**
 * Ensure a connected MongoClient is available (singleton).
 * Returns an object: { client, db }
 */
async function getClientAndDb() {
  if (_client && _client.topology && _client.topology.isConnected && _client.topology.isConnected()) {
    return { client: _client, db: _client.db() };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set in env. Set it in Vercel or export it locally before running.');
  }

  // Reuse promise to avoid multiple parallel connects
  if (!_clientPromise) {
    _client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    _clientPromise = _client.connect();
  }
  await _clientPromise;
  return { client: _client, db: _client.db() };
}

/**
 * Get the products collection (native driver).
 * Optionally set PRODUCTS_COLLECTION env to change collection name (e.g. products_minifig).
 * Optionally set DB_NAME env to change DB name (not recommended if your MONGODB_URI already selects the DB).
 */
async function getProductsCollection() {
  const { db } = await getClientAndDb();
  const collectionName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products';
  return db.collection(collectionName);
}

module.exports = { getProductsCollection };