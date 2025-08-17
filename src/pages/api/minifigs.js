// src/pages/api/minifigs.js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bricklink";

// Prefer enriched -> minifig -> products
const collNamePref =
  process. PAYPAL_CLIENT_SECRET_REDACTED||
  process. PAYPAL_CLIENT_SECRET_REDACTED||
  process. PAYPAL_CLIENT_SECRET_REDACTED||
  "products_minifig_enriched";

// cache client across HMR/requests
let _clientPromise;
function getClient() {
  if (!uri) {
    const err = new Error(
      "Missing env: MONGODB_URI (set it in .env.local for dev and in Vercel for prod)"
    );
    err.code = "NO_MONGODB_URI";
    throw err;
  }
  if (!_clientPromise) {
    const client = new MongoClient(uri);
    _clientPromise = client.connect();
  }
  return _clientPromise;
}

// cheap HTML entity decoder for common numeric/entities in your data
function decodeHtml(s) {
  if (!s || typeof s !== "string") return s;
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export default async function handler(req, res) {
  res.setHeader("x-minifigs-handler", "v3.1-js");

  try {
    const client = await getClient();
    const db = client.db(dbName);

    const collName =
      process. PAYPAL_CLIENT_SECRET_REDACTED||
      process. PAYPAL_CLIENT_SECRET_REDACTED||
      process. PAYPAL_CLIENT_SECRET_REDACTED||
      collNamePref;

    const isMinifigsColl = /minifig/i.test(collName);

    res.setHeader("x-minifigs-db", dbName);
    res.setHeader("x-minifigs-coll", collName);
    res.setHeader("x-minifigs-isMinifigsColl", String(isMinifigsColl));

    const col = db.collection(collName);

    const {
      id = "",
      itemNo = "",
      q = "",
      theme = "",
      inStock = "1",
      page = "1",
      limit = "36",
      sort = "newest",
      debug = "0",
    } = req.query;

    // If id/itemNo provided, prefer that direct fetch
    if (id || itemNo) {
      const directFilter = {};
      if (id) {
        // try ObjectId, fall back to string compare
        let oid = null;
        try {
          oid = new ObjectId(String(id));
        } catch {}
        directFilter.$or = [{ _id: oid }. _id ? [{ _id: oid }] : []].flat();
        directFilter.$or.push({ _id: String(id) });
      }
      if (itemNo) {
        directFilter.$or = [...(directFilter.$or || []), { itemNo: String(itemNo) }];
      }
      const doc = await col.findOne(directFilter);
      if (!doc) {
        return res.status(404).json({ error: "Not found", using: { dbName, collName } });
      }
      // project like list API does
      const _priceCents =
        doc.priceCents && doc.priceCents > 0 ? doc.priceCents : Math.round((doc.price || 0) * 100);
      const item = {
        _id: String(doc._id),
        id: String(doc._id),
        itemNo: doc.itemNo,
        name: decodeHtml(doc.name || ""),
        theme: doc.theme || doc.themeName || "Unknown",
        price: _priceCents > 0 ? _priceCents / 100 : doc.price || 0,
        priceCents: _priceCents || 0,
        imageUrl:
          doc.imageUrl ||
          doc.mainImage ||
          doc.image ||
          doc.imageURL ||
          (Array.isArray(doc.images) ? doc.images[0] : "") ||
          "",
        stock: doc.stock ?? doc.qty ?? doc.quantity ?? 0,
      };
      return res.status(200).json(item);
    }

    // List flow
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(96, Math.max(1, parseInt(limit, 10) || 36));

    const filter = {};

    // ONLY gate to minifigs if we are NOT already on a “minifig” collection
    if (!isMinifigsColl) {
      filter.$or = [
        { category: /minifig/i },
        { type: /minifig/i },
        { class: /minifig/i },
        { isMinifig: true },
      ];
    }

    if (theme) {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ theme }, { themeName: theme }, { "theme.name": theme }] },
      ];
    }

    if (inStock !== "0") {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { stock: { $gt: 0 } },
            { qty: { $gt: 0 } },
            { quantity: { $gt: 0 } },
            { available: true },
          ],
        },
      ];
    }

    if (q) {
      const esc = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i");
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ name: rx }, { itemNo: rx }, { sku: rx }, { keywords: rx }] },
      ];
    }

    const sortSpec =
      sort === "price-asc"
        ? { priceCents: 1, price: 1 }
        : sort === "price-desc"
        ? { priceCents: -1, price: -1 }
        : sort === "name"
        ? { name: 1 }
        : { _id: -1 };

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          _stock: {
            $ifNull: ["$stock", { $ifNull: ["$qty", { $ifNull: ["$quantity", 0] }] }],
          },
          _priceCents: {
            $cond: [
              { $gt: ["$priceCents", 0] },
              "$priceCents",
              { $multiply: [{ $ifNull: ["$price", 0] }, 100] },
            ],
          },
          _imageUrl: {
            $ifNull: [
              "$imageUrl",
              {
                $ifNull: [
                  "$mainImage",
                  {
                    $ifNull: [
                      "$image",
                      { $ifNull: ["$imageURL", { $arrayElemAt: ["$images", 0] }] },
                    ],
                  },
                ],
              },
            ],
          },
          _theme: { $ifNull: ["$theme", { $ifNull: ["$themeName", "Unknown"] }] },
          _nameDecoded: { $literal: null }, // placeholder for projection stage
        },
      },
      {
        $facet: {
          meta: [{ $count: "total" }, { $addFields: { page: pageNum, limit: pageSize } }],
          items: [
            { $sort: sortSpec },
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 1,
                id: "$_id",
                itemNo: 1,
                name: "$name", // we’ll decode on the way out
                theme: "$_theme",
                price: {
                  $cond: [{ $gt: ["$_priceCents", 0] }, { $divide: ["$_priceCents", 100] }, "$price"],
                },
                priceCents: "$_priceCents",
                imageUrl: "$_imageUrl",
                stock: "$_stock",
              },
            },
          ],
          facets: [
            { $group: { _id: "$_theme", count: { $sum: 1 } } },
            { $project: { _id: 0, theme: "$_id", count: 1 } },
            { $sort: { count: -1, theme: 1 } },
            { $limit: 100 },
          ],
        },
      },
      {
        $project: {
          items: 1,
          meta: {
            $ifNull: [{ $arrayElemAt: ["$meta", 0] }, { total: 0, page: pageNum, limit: pageSize }],
          },
          facets: 1,
        },
      },
    ];

    const [raw] = await col.aggregate(pipeline).toArray();

    // Decode names on the server so the UI doesn’t see &#40;…&#41;
    const result = {
      ...raw,
      items: (raw.items || []).map((it) => ({
        ...it,
        name: decodeHtml(it.name || ""),
      })),
    };

    if (debug === "1" || debug === "true") {
      return res.status(200).json({
        using: { dbName, collName, isMinifigsColl, filter, sortSpec },
        result,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=59");
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/minifigs] error:", err);
    return res.status(500).json({
      error: err?.message || "Server error",
      code: err?.code || null,
      env: {
        hasUri: !!process.env.MONGODB_URI,
        db: dbName,
        collPref: collNamePref,
        vercel: process.env.VERCEL ?? null,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        nodeEnv: process.env.NODE_ENV ?? null,
      },
    });
  }
}