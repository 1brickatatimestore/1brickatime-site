// src/lib/db.ts
import mongoose from "mongoose";

declare global {
  // Allow globalThis.mongooseConnection for caching
  var mongooseConnection: mongoose.Mongoose | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

export default async function dbConnect(): Promise<mongoose.Mongoose> {
  // Use the cached connection if it exists
  if (globalThis.mongooseConnection) {
    return globalThis.mongooseConnection;
  }
  // Otherwise, establish a new connection
  const connection = await mongoose.connect(MONGODB_URI);
  globalThis.mongooseConnection = connection;
  return connection;
}
