// pages/api/sync-bricklink.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMinifigsFromBricklink } from '@/lib/bricklink';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await fetchMinifigsFromBricklink();

    if (!data?.data) {
      return res.status(500).json({ error: 'Invalid BrickLink response' });
    }

    const minifigs = data.data.slice(0, 20).map((item: any) => ({
      no: item.no,
      name: item.name,
      img_url: item.thumbnail_url,
    }));

    res.status(200).json(minifigs);
  } catch (error: any) {
    console.error('Error syncing with BrickLink:', error);
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
}