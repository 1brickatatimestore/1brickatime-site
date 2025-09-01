// src/pages/api/minifigs-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

type RawDoc = Record<string, any>;

const uri = process.env.MONGODB_URI!;
const DB = process.env.MONGODB_DB || "bricklink";

// Prefer enriched → fallback to minifigs → fallback to products
const COLL_PRODUCTS = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_predeploy_20250816T203840Z";
const COLL_MINIFIGS = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig";
const COLL_MINIFIGS_ENRICHED = process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig_enriched";

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
function getClient() {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise!;
}

/**
 * We treat “available for sale” like BrickLink:
 *  - NOT in stockroom
 *  - quantity > 0 (qty | quantity | stock)
 *  - looks like a minifig
 */
function minifigMatch(includingStockroom = false) {
  const m: any = {};
  // classify as minifig (broad net, since DB fields vary)
  (m.$and ??= []).push({
    $or: [
      { category: /minifig/i },
      { type: /minifig/i },
      { class: /minifig/i },
      { isMinifig: true },
    ],
  });

  if (!includingStockroom) {
    // Exclude stockroom / not for sale
    (m.$and ??= []).push({
      $nor: [
        { stockroom: true },
        { inStockroom: true },
        { status: /stockroom/i },
        { location: /stockroom/i }, // some dumps encode it as text
      ],
    });
  }

  // must have quantity > 0 if available view
  (m.$and ??= []).push({
    $or: [
      { qty: { $gt: 0 } },
      { quantity: { $gt: 0 } },
      { stock: { $gt: 0 } },
    ],
  });

  return m;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await getClient();
    const db = client.db(DB);

    const { includeStockroom = "0" } = (req.query as Record<string, string>) || {};
    const wantStockroom = includeStockroom === "1";

    // choose best collection on your env
    const collName =
      (await db.listCollections({ name: COLL_MINIFIGS_ENRICHED }).hasNext())
        ? COLL_MINIFIGS_ENRICHED
        : (await db.listCollections({ name: COLL_MINIFIGS }).hasNext())
          ? COLL_MINIFIGS
          : COLL_PRODUCTS;

    const col = db.collection<RawDoc>(collName);

    const mAvail = minifigMatch(false);
    const mAll   = minifigMatch(true); // includes stockroom

    // Available-for-sale counts
    const [availableLots, availableItemsDoc] = await Promise.all([
      col.countDocuments(mAvail),
      col.aggregate([
        { $match: mAvail },
        {
          $group: {
            _id: null,
            items: {
              $sum: {
                $cond: [
                  { $gt: ["$qty", 0] }, "$qty",
                  {
                    $cond: [
                      { $gt: ["$quantity", 0] }, "$quantity",
                      {
                        $cond: [{ $gt: ["$stock", 0] }, "$stock", 0],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]).toArray(),
    ]);

    // Totals including stockroom (for your own reference)
    const [totalLots, totalItemsDoc] = await Promise.all([
      col.countDocuments(mAll),
      col.aggregate([
        { $match: mAll },
        {
          $group: {
            _id: null,
            items: {
              $sum: {
                $cond: [
                  { $gt: ["$qty", 0] }, "$qty",
                  {
                    $cond: [
                      { $gt: ["$quantity", 0] }, "$quantity",
                      {
                        $cond: [{ $gt: ["$stock", 0] }, "$stock", 0],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]).toArray(),
    ]);

    const availableItems = availableItemsDoc[0]?.items ?? 0;
    const totalItems = totalItemsDoc[0]?.items ?? 0;

    return res.status(200).json({
      ok: true,
      using: { db: DB, coll: collName },
      stats: {
        availableLots,
        availableItems,
        totalLots,
        totalItems,
      },
    });
  } catch (err: any) {
    console.error("[api/minifigs-stats] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}