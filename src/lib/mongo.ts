import { MongoClient, Db } from "mongodb";

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function read(envKey: string, fallback = ""): string {
  // trim to avoid stray \n from copied envs
  return (process.env[envKey] ?? fallback).trim();
}

const uri = read("MONGODB_URI");
if (!uri) throw new Error("MONGODB_URI is not set");

const dbName = read("MONGODB_DB");
if (!dbName) throw new Error("MONGODB_DB is not set");

const client = new MongoClient(uri, {
  // nice defaults for serverless
  maxPoolSize: 5,
});

const clientPromise =
  global.__mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global.__mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName);
}

export function getCollectionName(key: string, fallback: string): string {
  return read(key, fallback);
}
