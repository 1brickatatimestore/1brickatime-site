import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { minifigs } = await db();
    const allMinifigs = await minifigs.find({}).toArray();
    res.json(allMinifigs);
  } catch (err) {
    console.error('Failed to fetch minifigs:', err);
    res.status(500).json({ error: 'Failed to fetch minifigs' });
  }
});

export default router;
