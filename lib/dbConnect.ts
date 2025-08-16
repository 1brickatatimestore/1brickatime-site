// src/lib/dbConnect.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) throw new Error('MONGODB_URI missing')

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var __mongooseConn: Promise<typeof mongoose> | undefined
}

export default async function dbConnect() {
  if (!global.__mongooseConn) {
    global.__mongooseConn = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10
    } as any)
  }
  return global.__mongooseConn
}