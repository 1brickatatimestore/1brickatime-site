// src/lib/dbConnect.ts
import mongoose from 'mongoose'

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var __MONGOOSE_CONN: Promise<typeof mongoose> | null
}

const { MONGODB_URI } = process.env
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set')
}

export default async function dbConnect(uri = MONGODB_URI) {
  if (!global.__MONGOOSE_CONN) {
    global.__MONGOOSE_CONN = mongoose
      .connect(uri, {
        maxPoolSize: 8,
        serverSelectionTimeoutMS: 6000,
      })
      .then((m) => m)
  }
  return global.__MONGOOSE_CONN
}