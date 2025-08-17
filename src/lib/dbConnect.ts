// src/lib/dbConnect.ts
import mongoose from 'mongoose'

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

  return cached.conn
}