// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";
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

function parseBool(v: any, def = false) {
  if (v == null) return def;
  const s = String(v).toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(s);
}

function moneyToCents(doc: any) {
  if (doc.priceCents && doc.priceCents > 0) return doc.priceCents;
  const p = Number(doc.price ?? 0);
  return Math.round(p * 100);
}

function stockValue(doc: any) {
  return Number(doc.stock ?? doc.qty ?? doc.quantity ?? (doc.available ? 1 : 0) ?? 0) || 0;
}

function imagePick(doc: any) {
  const arr = Array.isArray(doc.images) ? doc.images : [];
  return (
    doc.imageUrl ||
    doc.mainImage ||
    doc.image ||
    doc.blImageUrl ||
    (arr.length ? arr[0] : "") ||
    ""
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now();
  try {
    const client = await getClient();
    const db = client.db(DB_NAME);
    const col = db.collection(COLL_PRODUCTS);

    const {
      id,
      type = "",
      q = "",
      theme = "",
      collection = "",
      series = "",
      inStock = "1",
      page = "1",
      limit = "36",
      sort = "name",
      debug = "0",
    } = req.query as Record<string, string>;

    const isMini = String(type).toUpperCase().includes("MINIFIG");

    // ---- Single fetch by id or itemNo ----
    if (id) {
      let doc: any = null;
      if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
        doc = await col.findOne({ _id: new ObjectId(String(id)) });
      }
      if (!doc) doc = await col.findOne({ itemNo: String(id) });
      if (!doc) return res.status(404).json({ error: "Not found" });

      // Project to the same shape the list returns
      const out = {
        _id: String(doc._id),
        id: String(doc._id),
        itemNo: doc.itemNo || "",
        name: doc.name || "",
        remarks: doc.remarks || "",
        inventoryId: doc.inventoryId ?? null,
        price: moneyToCents(doc) / 100,
        priceCents: moneyToCents(doc),
        imageUrl: imagePick(doc) || null,
        stock: stockValue(doc),
        theme: doc.theme || "",
        collection: "",
        series: "",
        condition: doc.condition || "",
      };
      return res.status(200).json(out);
    }

    // ---- List with filters + facets ----
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSize = Math.min(96, Math.max(1, parseInt(String(limit), 10) || 36));

    // Basic filter: keep it simple and stable on your dataset
    const and: any[] = [];
    if (isMini) and.push({ type: "MINIFIG" });
    else if (type && type !== "ALL") and.push({ type: String(type) });

    if (q) {
      const esc = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i");
      and.push({ $or: [{ name: rx }, { itemNo: rx }, { remarks: rx }] });
    }

    // We’ll derive _theme/_series/_collection, then optionally filter on them
    if (theme) and.push({ _theme: String(theme) });
    if (collection) and.push({ _collection: String(collection) });
    if (series) and.push({ _series: String(series) });

    if (parseBool(inStock, isMini ? true : false)) {
      and.push({
        $or: [
          { stock: { $gt: 0 } },
          { qty: { $gt: 0 } },
          { quantity: { $gt: 0 } },
          { available: true },
        ],
      });
    }

    const matchStage = and.length ? { $match: { $and: and } } : { $match: {} };

    let sortSpec: Record<string, 1 | -1> = { name: 1 };
    if (sort === "newest") sortSpec = { _id: -1 };
    else if (sort === "price-asc") sortSpec = { _priceCents: 1, price: 1 };
    else if (sort === "price-desc") sortSpec = { _priceCents: -1, price: -1 };
    else if (sort === "name") sortSpec = { name: 1 };

    const pipeline: any[] = [
      matchStage,
      // Derive normalized theme/series/collection + stock/price/img
      {
        $addFields: {
          _theme: mongoAddFieldsTheme() as any,
        },
      },
      {
        $addFields: {
          _series: mongoAddFieldsSeries() as any,
          _collection: mongoAddFieldsCollection() as any,
          _stock: {
            $toInt: {
              $ifNull: ["$stock",
                { $ifNull: ["$qty",
                  { $ifNull: ["$quantity", { $cond: [{ $eq: ["$available", true] }, 1, 0] }] }
                ] }
              ],
            },
          },
          _priceCents: {
            $cond: [
              { $gt: ["$priceCents", 0] },
              "$priceCents",
              { $multiply: [{ $toDouble: { $ifNull: ["$price", 0] } }, 100] },
            ],
          },
          _img: {
            $ifNull: [
              "$imageUrl",
              { $ifNull: [
                "$mainImage",
                { $ifNull: [
                  "$image",
                  { $ifNull: [
                    "$blImageUrl",
                    { $arrayElemAt: ["$images", 0] }
                  ] }
                ] }
              ] }
            ]
          },
        },
      },
      {
        $facet: {
          meta: [
            { $count: "total" },
            { $addFields: { page: pageNum, limit: pageSize } },
          ],
          items: [
            { $sort: sortSpec },
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 1,
                id: "$_id",
                itemNo: 1,
                name: 1,
                remarks: 1,
                inventoryId: 1,
                condition: 1,
                theme: "$_theme",
                collection: "$_collection",
                series: "$_series",
                price: {
                  $cond: [
                    { $gt: ["$_priceCents", 0] },
                    { $divide: ["$_priceCents", 100] },
                    { $toDouble: { $ifNull: ["$price", 0] } },
                  ],
                },
                priceCents: "$_priceCents",
                imageUrl: "$_img",
                stock: "$_stock",
              },
            },
          ],
          themes: [
            { $group: { _id: "$_theme", count: { $sum: 1 } } },
            { $project: { _id: 0, theme: "$_id", count: 1 } },
            { $sort: { count: -1, theme: 1 } },
            { $limit: 200 },
          ],
          collections: [
            { $group: { _id: "$_collection", count: { $sum: 1 } } },
            { $project: { _id: 0, collection: "$_id", count: 1 } },
            { $sort: { count: -1, collection: 1 } },
            { $limit: 200 },
          ],
          seriesFacet: [
            { $match: { _series: { $ne: "" } } },
            { $group: { _id: "$_series", count: { $sum: 1 } } },
            { $project: { _id: 0, series: "$_id", count: 1 } },
            { $sort: { series: 1 } },
            { $limit: 200 },
          ],
        },
      },
      {
        $project: {
          items: 1,
          meta: {
            $ifNull: [{ $arrayElemAt: ["$meta", 0] }, { total: 0, page: pageNum, limit: pageSize }],
          },
          facets: {
            themes: "$themes",
            collections: "$collections",
            series: "$seriesFacet",
          },
        },
      },
    ];

    const [agg] = await col.aggregate(pipeline, { allowDiskUse: true }).toArray();

    if (parseBool(debug)) {
      return res.status(200).json({
        using: { DB_NAME, COLL_PRODUCTS, isMini, sortSpec },
        result: agg,
        elapsedMs: Date.now() - started,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=45");
    return res.status(200).json(agg);
  } catch (err: any) {
    console.error("[api/products] error:", err);
    return res.status(500).json({
      error: err?.message || "Server error",
      elapsedMs: Date.now() - started,
    });
  }
}

export const config = { api: { bodyParser: false } };