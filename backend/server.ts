// server.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, Db } from 'mongodb'

import syncBricklink from './syncBricklink'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

let db: Db

// Connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI!)
client.connect()
  .then(() => {
    db = client.db(process.env.MONGODB_DB)
    console.log('✅ Connected to MongoDB')
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err)
  })

// Route to sync data from Bricklink
app.get('/api/sync-bricklink', async (req, res) => {
  try {
    await syncBricklink()
    res.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error syncing Bricklink:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`)
})