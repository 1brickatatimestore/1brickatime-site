// src/lib/dbConnect.ts
import mongoose from 'mongoose'

/**
 * Reusable Mongoose connector with global caching in dev
 * so we don't open a new socket on every API call.
 */
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment')
}

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

// @ts-ignore - attach to global in dev
let cached: Cached = global._mongooseCached || { conn: null, promise: null }
// @ts-ignore
if (!global._mongooseCached) global._mongooseCached = cached

export default async function dbConnect(uri = MONGODB_URI) {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        // sane defaults
        dbName: undefined, // use the one in the URI
      })
      .then((m) => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}