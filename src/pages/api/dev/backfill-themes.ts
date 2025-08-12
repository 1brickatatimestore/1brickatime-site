import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db';
import themesData from '@/data/themes.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection('themes');

  await collection.deleteMany({});
  await collection.insertMany(themesData);

  res.status(200).json({ message: 'Themes backfilled successfully' });
}