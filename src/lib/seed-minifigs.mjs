// scripts/seed-minifigs.mjs
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const {
  MONGODB_URI,
  MONGODB_DB = 'bricklink',
  MINIFIGS_COLLECTION = 'products_minifig',
  MINIFIGS_ENRICHED_COLLECTION = 'products_minifig_enriched',
  NEXT_PUBLIC_CURRENCY = 'AUD',
} = process.env;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing. Put it in .env.local or run with dotenv_config_path');
  process.exit(1);
}

const sample = [
  {
    sku: 'SW001',
    name: 'Luke Skywalker (Tatooine)',
    theme: 'Star Wars',
    price: { value: 19.99, currency: NEXT_PUBLIC_CURRENCY },
    stock: 5,
    live: true,
    images: ['https://images.brickset.com/sets/large/75052-1.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    sku: 'HP001',
    name: 'Harry Potter (Hogwarts Robes)',
    theme: 'Harry Potter',
    price: { value: 14.99, currency: NEXT_PUBLIC_CURRENCY },
    stock: 8,
    live: true,
    images: ['https://images.brickset.com/sets/large/75955-1.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    sku: 'CTY001',
    name: 'City Firefighter',
    theme: 'City',
    price: { value: 7.99, currency: NEXT_PUBLIC_CURRENCY },
    stock: 20,
    live: true,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  // Seed both “base” and “enriched” so your API will find data no matter which it reads
  const c1 = db.collection(MINIFIGS_COLLECTION);
  const c2 = db.collection(MINIFIGS_ENRICHED_COLLECTION);

  // idempotent-ish: upsert by sku
  for (const doc of sample) {
    await c1.updateOne({ sku: doc.sku }, { $set: doc }, { upsert: true });
    await c2.updateOne({ sku: doc.sku }, { $set: doc }, { upsert: true });
  }

  const n1 = await c1.countDocuments();
  const n2 = await c2.countDocuments();

  console.log(`✅ Seed complete.`);
  console.log(`   ${MINIFIGS_COLLECTION}: ${n1} docs`);
  console.log(`   ${MINIFIGS_ENRICHED_COLLECTION}: ${n2} docs`);

  await client.close();
})().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});