import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Example mock implementation for bank transfer
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: 'Missing amount or orderId' });
  }

  // Normally, you would integrate with your banking API here
  res.status(200).json({ ok: true, message: 'Bank transfer initiated' });
}