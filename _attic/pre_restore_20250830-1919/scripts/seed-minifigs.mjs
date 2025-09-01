import { MongoClient } from "mongodb";
import fs from "fs";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const collectionName = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig";

if (!uri || !dbName) {
  console.error("Missing MONGODB_URI or MONGODB_DB in environment");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // Example: load from local JSON file
  const data = JSON.parse(fs.readFileSync("./data/minifigs.json", "utf8"));

  await collection.deleteMany({});
  const result = await collection.insertMany(data);

  console.log(`✅ Seeded ${result.insertedCount} minifigs into ${collectionName}`);
} catch (err) {
  console.error("❌ Failed seeding minifigs:", err);
  process.exit(1);
} finally {
  await client.close();
}