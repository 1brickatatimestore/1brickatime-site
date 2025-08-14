import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keys = [
    'BRICKLINK_CONSUMER_KEY',
    'BRICKLINK_CONSUMER_SECRET',
    'BRICKLINK_TOKEN_VALUE',
    'BRICKLINK_TOKEN_SECRET',
  ];
  const present: Record<string, boolean> = {};
  for (const k of keys) present[k] = !!(process.env[k] && process.env[k]!.length > 8);

  res.status(200).json({ ok: true, bricklink: present });
}
