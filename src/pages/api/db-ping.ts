import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../lib/mongo";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();
    const admin = db.admin();
    const ping = await admin.ping();
    res.status(200).json({ ok: true, db: db.databaseName, ping });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
