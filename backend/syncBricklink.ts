// backend/syncBricklink.ts
import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE = 'https://api.bricklink.com/api/store/v1'

const oauth = new OAuth({
  consumer: {
    key: process.env.BRICKLINK_CONSUMER_KEY!,
    secret: process.env.BRICKLINK_CONSUMER_SECRET!
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64')
  }
})

const token = {
  key: process.env.BRICKLINK_TOKEN!,
  secret: process.env.BRICKLINK_TOKEN_SECRET!
}

export default async function syncBricklink() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB)
  const collection = db.collection(process.env.MINIFIGS_COLLECTION!)

  const request_data = {
    url: `${API_BASE}/inventory`,
    method: 'GET'
  }

  try {
    const response = await axios.get(request_data.url, {
      headers: oauth.toHeader(oauth.authorize(request_data, token))
    })

    const items = response.data.data

    // Clear old collection
    await collection.deleteMany({})
    // Insert new data
    await collection.insertMany(items)

    console.log(`✅ Synced ${items.length} items from BrickLink.`)
    await client.close()
    return items
  } catch (err: any) {
    console.error('❌ BrickLink sync failed:', err.message)
    throw err
  }
}