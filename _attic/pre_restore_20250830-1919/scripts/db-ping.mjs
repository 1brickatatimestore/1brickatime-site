import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  console.error("Missing MONGODB_URI or MONGODB_DB in environment");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const admin = client.db(dbName).admin();
  const result = await admin.ping();
  console.log("✅ MongoDB connection successful:", result);
} catch (err) {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
} finally {
  await client.close();
}