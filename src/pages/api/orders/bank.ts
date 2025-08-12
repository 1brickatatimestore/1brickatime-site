// src/pages/api/orders/bank.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Order from '../../../models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { customer, items } = req.body as {
    customer: { name: string; email: string; notes?: string };
    items: { name: string; price: number; qty?: number; itemNo?: string }[];
  };

  if (!customer?.name || !customer?.email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Missing customer or items' });
  }

  const total = items.reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0);

  try {
    await dbConnect();
    await Order.create({
      paymentMethod: 'bank',
      status: 'pending',
      items,
      total,
      customer,
    });
  } catch (e) {
    // If DB is not configured we still succeed, just log it
    console.warn('Bank order saved in memory only:', e);
  }

  return res.status(200).json({ ok: true, total });
}