// src/pages/api/themes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import {
  mongoAddFieldsTheme,
  mongoAddFieldsSeries,
  mongoAddFieldsCollection,
} from "@/lib/minifig-taxonomy";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.MONGODB_DB || "bricklink";
const COLL_PRODUCTS = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products";

let _client: Promise<MongoClient> | null = null;
function getClient() {
  if (!_client) _client = new MongoClient(MONGODB_URI).connect();
  return _client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now();
  try {
    const client = await getClient();
    const db = client.db(DB_NAME);
    const col = db.collection(COLL_PRODUCTS);

    const type = String(req.query.type || "MINIFIG").toUpperCase();

    const pipeline = [
      { $match: { type } },
      { $addFields: { _theme: mongoAddFieldsTheme() as any } },
      { $addFields: { _series: mongoAddFieldsSeries() as any, _collection: mongoAddFieldsCollection() as any } },
      {
        $facet: {
          themes: [
            { $group: { _id: "$_theme", count: { $sum: 1 } } },
            { $project: { _id: 0, theme: "$_id", count: 1 } },
            { $sort: { count: -1, theme: 1 } },
            { $limit: 300 },
          ],
          collections: [
            { $group: { _id: "$_collection", count: { $sum: 1 } } },
            { $project: { _id: 0, collection: "$_id", count: 1 } },
            { $sort: { count: -1, collection: 1 } },
            { $limit: 200 },
          ],
          series: [
            { $match: { _series: { $ne: "" } } },
            { $group: { _id: "$_series", count: { $sum: 1 } } },
            { $project: { _id: 0, series: "$_id", count: 1 } },
            { $sort: { series: 1 } },
          ],
        },
      },
      { $project: { themes: 1, collections: 1, series: 1 } },
    ];

    const [f] = await col.aggregate(pipeline).toArray();
    return res.status(200).json({ options: f?.themes ?? [], collections: f?.collections ?? [], series: f?.series ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: "products_facets_unavailable", detail: JSON.stringify({ error: err?.message, elapsedMs: Date.now() - started }) });
  }
}