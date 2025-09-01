import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('❌ MONGODB_URI is missing in .env.local');
}

const client = new MongoClient(uri);
let cachedDb = null;

export default async function db() {
  if (cachedDb) return cachedDb;
  await client.connect();
  const database = client.db('bricklink');
  const minifigs = database.collection('minifigs');
  cachedDb = { minifigs };
  return cachedDb;
}
