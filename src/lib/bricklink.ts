mkdir -p src/lib
cat > src/lib/bricklink.ts <<'TS'
import crypto from "crypto";

/**
 * Minimal OAuth 1.0a signer for BrickLink Store API using HMAC-SHA1.
 * Works with either BL_* or BRICKLINK_* env var names.
 */
function getEnv(name: string, fallback?: string) {
  return (
    process.env[name] ||
    process.env["BL_" + name] ||
    process.env["BRICKLINK_" + name] ||
    fallback ||
    ""
  );
}

const CONSUMER_KEY     = getEnv("CONSUMER_KEY");
const CONSUMER_SECRET  = getEnv("CONSUMER_SECRET");
const OAUTH_TOKEN      = getEnv("OAUTH_TOKEN");
const OAUTH_TOKEN_SECRET = getEnv("OAUTH_TOKEN_SECRET");

if (!CONSUMER_KEY || !CONSUMER_SECRET || !OAUTH_TOKEN || !OAUTH_TOKEN_SECRET) {
  // We won't throw here; api route will surface a clear error message.
}

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/[!*()']/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildAuthHeader(method: string, url: string, extraParams: Record<string,string|number> = {}) {
  const oauthParams: Record<string,string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_token: OAUTH_TOKEN,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_version: "1.0",
  };

  const allParams: Record<string,string> = {
    ...Object.fromEntries(
      Object.entries(extraParams).map(([k,v]) => [k, String(v)])
    ),
    ...oauthParams,
  };

  // Normalize params
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url.split("?")[0]),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(OAUTH_TOKEN_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  const oauthHeader = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const header = "OAuth " + Object.keys(oauthHeader)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthHeader[k])}"`)
    .join(", ");

  return header;
}

/**
 * Call BrickLink Store API.
 * Docs: https://www.bricklink.com/v3/api.page?page=store-api
 */
async function blFetch<T>(path: string, query: Record<string, string | number> = {}) {
  const base = "https://api.bricklink.com/api/store/v1";
  const qs = new URLSearchParams();
  for (const [k,v] of Object.entries(query)) qs.set(k, String(v));
  const url = `${base}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  const auth = buildAuthHeader("GET", url, query);
  const res = await fetch(url, { headers: { Authorization: auth } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`BrickLink ${res.status} ${res.statusText}: ${text || url}`);
  }
  const data = await res.json();
  return data as T;
}

type BLInventoryItem = {
  inventory_id: number;
  item: {
    no: string;           // e.g. "jw038"
    name?: string;        // may be missing in some responses
    type: string;         // "MINIFIG"
  };
  color_id?: number;      // not used for minifigs
  quantity: number;
  new_or_used: "N" | "U";
  unit_price: number;
  remarks?: string;
  comments?: string;
  reserved_qty?: number;
  stock_room?: "Y" | "N"; // "Y" => stockroom (NOT for sale)
  status?: "A" | "I";     // A active, I inactive
};

type BLResponse<T> = { meta: { code: number; description: string }; data: T };

/**
 * Fetch ONLY items AVAILABLE FOR SALE (not stockroom), type MINIFIG.
 * BrickLink "inventories" endpoint returns your store inventory.
 */
export async function fetchMinifigsPage(page = 1, limit = 36) {
  // BrickLink uses page/page_size in some endpoints. We’ll use a safe
  // approach: request page/limit; if unsupported, fetch more and slice.
  const page_size = Math.min(Math.max(limit, 1), 200);

  // Query we’ll try:
  // - item_type=MINIFIG (minifigs)
  // - status=Y (for sale)
  // - stock_room=N (exclude stockroom)
  const query = {
    item_type: "MINIFIG",
    status: "Y",
    stock_room: "N",
    page,
    page_size,
  } as Record<string,string|number>;

  // Main attempt
  try {
    const r = await blFetch<BLResponse<BLInventoryItem[]>>("/inventories", query);
    const rows = Array.isArray(r?.data) ? r.data : [];

    // Derive friendly fields
    const items = rows.map((d) => {
      const itemNo = d?.item?.no || "";
      const name = d?.item?.name || ""; // often missing — OK
      const imageUrl = itemNo ? `https://img.bricklink.com/ItemImage/MN/0/${encodeURIComponent(itemNo)}.png` : "";
      return {
        id: String(d.inventory_id),
        itemNo,
        name,
        price: Number(d.unit_price || 0),
        stock: Math.max(0, Number(d.quantity || 0) - Number(d.reserved_qty || 0)),
        imageUrl,
        remarks: d.remarks || d.comments || "",
        condition: d.new_or_used === "N" ? "New" : "Used",
        theme: "",       // taxonomy step can fill later
        collection: "",
        series: "",
      };
    });

    return {
      items,
      meta: {
        totalLots: items.length, // BrickLink doesn’t return totals here; this is page size
        page,
        pageSize: limit,
      },
    };
  } catch (err) {
    // Surface error to caller; they may choose a fallback.
    throw err;
  }
}
TS