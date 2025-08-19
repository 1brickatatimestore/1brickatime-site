// src/lib/bricklink.ts
import crypto from "crypto";

// Tiny BrickLink OAuth 1.0 client (for your own store inventory)
type OAuthCfg = {
  key: string;
  secret: string;
  token: string;
  tokenSecret: string;
  userId: string;
};

const cfg: OAuthCfg = {
  key: process.env.BL_KEY || "",
  secret: process.env.BL_SECRET || "",
  token: process.env.BL_TOKEN || "",
  tokenSecret: process.env.BL_TOKEN_SECRET || "",
  userId: process.env.BL_USER_ID || "",
};

function percent(s: string) {
  return encodeURIComponent(s)
    .replace(/[!*()']/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function nonce(len = 16) {
  return crypto.randomBytes(len).toString("hex");
}

function ts() {
  return Math.floor(Date.now() / 1000).toString();
}

function baseString(method: string, url: string, params: Record<string, string>) {
  const norm = Object.keys(params)
    .sort()
    .map((k) => `${percent(k)}=${percent(params[k])}`)
    .join("&");
  return [method.toUpperCase(), percent(url), percent(norm)].join("&");
}

function signingKey(consumerSecret: string, tokenSecret: string) {
  return `${percent(consumerSecret)}&${percent(tokenSecret)}`;
}

function hmacSha1(input: string, key: string) {
  return crypto.createHmac("sha1", key).update(input).digest("base64");
}

function authHeader(params: Record<string, string>) {
  const parts = Object.keys(params)
    .filter((k) => k.startsWith("oauth_"))
    .sort()
    .map((k) => `${percent(k)}="${percent(params[k])}"`);
  return "OAuth " + parts.join(", ");
}

async function blGET(path: string, query: Record<string, string | number | undefined> = {}) {
  if (!cfg.key || !cfg.secret || !cfg.token || !cfg.tokenSecret) {
    throw new Error("BrickLink credentials missing (BL_* env vars).");
  }
  const base = "https://api.bricklink.com/api/store/v1";
  const url = `${base}${path}`;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: cfg.key,
    oauth_nonce: nonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts(),
    oauth_token: cfg.token,
    oauth_version: "1.0",
  };

  // Merge OAuth + query for signature base
  const allParams: Record<string, string> = { ...oauthParams };
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) allParams[k] = String(v);
  }

  const baseStr = baseString("GET", url, allParams);
  const sig = hmacSha1(baseStr, signingKey(cfg.secret, cfg.tokenSecret));
  oauthParams.oauth_signature = sig;

  const q = Object.keys(query)
    .filter((k) => query[k] !== undefined && query[k] !== null)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(query[k]))}`)
    .join("&");
  const finalUrl = q ? `${url}?${q}` : url;

  const resp = await fetch(finalUrl, {
    method: "GET",
    headers: {
      Authorization: authHeader(oauthParams),
      "Content-Type": "application/json",
    } as any,
    // Vercel edge/build sometimes needs this
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`BrickLink ${resp.status}: ${text || resp.statusText}`);
  }

  const json = await resp.json();
  // BrickLink wraps as { meta, data }
  return json?.data ?? json;
}

/**
 * Fetch ALL minifig lots for your store (available or stockroom),
 * then normalize into the shape the UI expects.
 */
export async function fetchLiveMinifigsAll(opts?: { limit?: number; light?: boolean; includeStockroom?: boolean }) {
  const limit = opts?.limit ?? 10000;
  const light = !!opts?.light;
  const includeStockroom = opts?.includeStockroom ?? true;

  // We pull INVENTORY (your store’s lots)
  // doc: GET /inventories
  // We'll filter to item.type = "MINIFIG"
  const all: any[] = await blGET("/inventories", { });

  // Filter & normalize
  const rows = all
    .filter((lot: any) => lot?.item?.type === "MINIFIG")
    .filter((lot: any) => includeStockroom ? true : Number(lot?.quantity) > 0)
    .slice(0, limit)
    .map((lot: any) => toLiveMinifig(lot, { light }));

  return rows;
}

/**
 * Fetch a single minifig lot by itemNo (first match).
 */
export async function fetchLiveMinifigByNo(itemNo: string) {
  if (!itemNo) return null;
  const all = await fetchLiveMinifigsAll({ limit: 10000, light: false, includeStockroom: true });
  return all.find((x) => x.itemNo === itemNo) || null;
}

/** Normalize a BrickLink lot to UI shape */
export function toLiveMinifig(lot: any, opts?: { light?: boolean }) {
  const light = !!opts?.light;
  const itemNo = lot?.item?.no || lot?.item?.number || lot?.item_no || "";
  const name = lot?.item?.name || lot?.description || "";
  const price = Number(lot?.unit_price ?? lot?.unitPrice ?? lot?.price ?? 0);
  const stock = Number(lot?.quantity ?? lot?.qty ?? 0);
  const remarks = lot?.remarks ?? lot?.remark ?? "";
  const condition = lot?.new_or_used ?? lot?.condition ?? "";
  const imageUrl =
    lot?.item?.image_url ||
    lot?.image_url ||
    (itemNo ? `https://img.bricklink.com/ItemImage/MN/0/${encodeURIComponent(itemNo)}.png` : "");

  // You can enrich “theme/collection/series” later (classification step)
  const theme = lot?.extra_info?.theme ?? "Other";
  const collection = lot?.extra_info?.collection ?? "Other";
  const series = lot?.extra_info?.series ?? "";

  const base = {
    id: itemNo,
    itemNo,
    name,
    price,
    stock,
    imageUrl,
    remarks,
    condition,
    theme,
    collection,
    series,
  };

  if (light) return base;

  return {
    ...base,
    lotId: lot?.inventory_id || lot?.id || null,
    description: lot?.description ?? "",
    weight: lot?.weight ?? null,
    // attach the raw just in case you want to debug in detail views
    _raw: lot,
  };
}

// Small helpers used by API routes
export function qInt(v: string | string[] | undefined, def = 0) {
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}

export function qStr(v: string | string[] | undefined, def = "") {
  return typeof v === "string" ? v : def;
}