import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getInventory } from '../src/lib/bricklink';

dotenv.config({ path: '.env.local' });

async function seed() {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB!;
  const collectionName = process.env.MINIFIGS_COLLECTION || 'products_minifig';

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  console.log('Fetching inventory from BrickLink...');
  const minifigs = await getInventory(); // your function to fetch from BrickLink

  if (!minifigs?.length) {
    console.error('No minifigs returned from BrickLink.');
    process.exit(1);
  }

  await collection.deleteMany({});
  await collection.insertMany(minifigs);

  console.log(`Seeded ${minifigs.length} minifigs.`);
  await client.close();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
