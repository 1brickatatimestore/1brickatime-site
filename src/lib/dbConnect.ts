// src/lib/dbConnect.ts
import mongoose from 'mongoose'

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var _mongooseConn: Promise<typeof mongoose> | undefined
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment')
}

export default async function dbConnect() {
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI, {
      // keep defaults simple; Mongoose v7+ uses modern drivers
    })
  }
  return global._mongooseConn
}