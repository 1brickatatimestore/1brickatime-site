// src/lib/dbConnect.ts
import mongoose from 'mongoose'

<<<<<<< HEAD
declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var __MONGO_CONN: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  } | undefined
}

// Ensures the module is only evaluated once in dev (HMR safe)
const cached = global.__MONGO_CONN || (global.__MONGO_CONN = { conn: null, promise: null })

export default async function dbConnect(uriFromEnv?: string) {
  if (cached.conn) return cached.conn

  const uri = uriFromEnv || process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  // IMPORTANT: pick the right DB (Atlas supports dbName override)
  const dbName = process.env.MONGODB_DB || undefined

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName, // e.g. "bricklink"
      // Good defaults for Next.js dev
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
  }

  cached.conn = await cached.promise

  // Make it easy for other modules to find the live connection
  ;(global as any).mongoose = mongoose

=======
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
>>>>>>> 2e685bd (Minifigs-by-theme: live CMF counts + Enter key; keep existing themes API)
  return cached.conn
}