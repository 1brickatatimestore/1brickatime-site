import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    res.status(200).json({ success: true, message: 'MongoDB connected!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}



