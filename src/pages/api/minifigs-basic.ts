// src/pages/api/minifigs-basic.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

type RawDoc = Record<string, any>;
type Item = {
  id: string;
  itemNo: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  remarks?: string;
  condition?: string;
  theme?: string;
  collection?: string;
  series?: string;
};
type ApiResponse = {
  items: Item[];
  meta: { total: number; page: number; pageSize: number };
};

const uri = process.env.MONGODB_URI!;
const DB = process.env.MONGODB_DB || "bricklink";

// Prefer your enriched minifigs if present; otherwise fall back.
const COLL_PRODUCTS =
  process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_predeploy_20250816T203840Z";
const COLL_MINIFIGS =
  process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig";
const COLL_MINIFIGS_ENRICHED =
  process. PAYPAL_CLIENT_SECRET_REDACTED|| "products_minifig_enriched";

declare global {
  //  PAYPAL_CLIENT_SECRET_REDACTEDno-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
function getClient() {
  if (!global._mongoClientPromise) {
    if (!uri) throw new Error("Missing MONGODB_URI");
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise!;
}

function coerceNumber(x: any): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function getStock(d: RawDoc): number {
  return (
    coerceNumber(d.stock) ||
    coerceNumber(d.qty) ||
    coerceNumber(d.quantity) ||
    (d.available ? 1 : 0)
  );
}
function getPrice(d: RawDoc): number {
  // prefer decimal dollars; otherwise cents → dollars
  if (typeof d.price === "number") return d.price;
  if (typeof d.priceCents === "number") return d.priceCents / 100;
  const n = Number(d.price);
  if (Number.isFinite(n)) return n;
  const cents = Number(d.priceCents);
  if (Number.isFinite(cents)) return cents / 100;
  return 0;
}
function getImage(d: RawDoc): string | null {
  return (
    d.imageUrl ||
    d.mainImage ||
    d.image ||
    d.img ||
    null
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  try {
    const client = await getClient();
    const db = client.db(DB);

    // Decide which collection to use for MINIFIGs
    const colName =
      COLL_MINIFIGS_ENRICHED || COLL_MINIFIGS || COLL_PRODUCTS;
    const col = db.collection<RawDoc>(colName);

    // Query params
    const {
      q = "",
      page = "1",
      limit = "36",
      sort = "name_asc",
      inStock = "1", // 1 = only items with stock > 0; 0 = include zero
    } = (req.query as Record<string, string>) || {};

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 36));
    const skip = (pageNum - 1) * pageSize;

    // Build a SAFE filter (no nested-path collisions)
    const m: any = {};

    // Restrict to minifigs
    (m.$and ??= []).push({
      $or: [
        { category: /minifig/i },
        { type: /minifig/i },
        { class: /minifig/i },
        { isMinifig: true },
      ],
    });

    // Text search
    if (q) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i");
      (m.$and ??= []).push({
        $or: [{ name: rx }, { itemNo: rx }, { sku: rx }, { keywords: rx }],
      });
    }

    // Stock gate
    if (inStock !== "0") {
      (m.$and ??= []).push({
        $or: [
          { stock: { $gt: 0 } },
          { qty: { $gt: 0 } },
          { quantity: { $gt: 0 } },
          { available: true },
        ],
      });
    }

    // Count first
    const total = await col.countDocuments(m);

    // Sort map
    const sortSpec: Record<string, 1 | -1> = (() => {
      switch (sort) {
        case "name_desc":
          return { name: -1 };
        case "price_asc":
          return { price: 1 };
        case "price_desc":
          return { price: -1 };
        default:
          return { name: 1 }; // name_asc
      }
    })();

    // Page query — project ONLY top-level fields to avoid collisions
    const rows = await col
      .find(m, {
        projection: {
          _id: 0,
          // keep raw top-levels only
          itemNo: 1,
          no: 1,
          id: 1,
          name: 1,
          price: 1,
          priceCents: 1,
          stock: 1,
          qty: 1,
          quantity: 1,
          available: 1,
          imageUrl: 1,
          mainImage: 1,
          image: 1,
          img: 1,
          remarks: 1,
          description: 1,
          condition: 1,
          theme: 1,
          themeName: 1,
          collection: 1,
          series: 1,
        },
        sort: sortSpec,
        skip,
        limit: pageSize,
      })
      .toArray();

    const items: Item[] = rows.map((d) => {
      const id = String(d.itemNo || d.no || d.id || "");
      return {
        id,
        itemNo: id,
        name: String(d.name || ""),
        price: getPrice(d),
        stock: getStock(d),
        imageUrl: getImage(d),
        remarks: String(d.remarks || ""),
        condition: String(d.condition || ""),
        // light labeling only; **no** nested projections here
        theme: String(d.themeName || d.theme || ""),
        collection: String(d.collection || ""),
        series: String(d.series || ""),
      };
    });

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json({
      items,
      meta: { total, page: pageNum, pageSize },
    });
  } catch (err: any) {
    console.error("[api/minifigs-basic] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}