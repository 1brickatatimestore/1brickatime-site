// src/pages/api/sync-bricklink.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import crypto from "crypto";

// Environment variables expected (either BRICKLINK_* or BL_* variants should be set)
const BRICKLINK_CONSUMER_KEY = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BL_KEY || process.env.BL_KEY;
const BRICKLINK_CONSUMER_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BL_SECRET;
const BRICKLINK_OAUTH_TOKEN = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BL_TOKEN;
const BRICKLINK_OAUTH_TOKEN_SECRET = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BL_TOKEN_SECRET;
const BRICKLINK_USER_ID = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BL_USER_ID || process.env.BRICKLINK_USER_ID;
const MONGODB_URI = process.env.MONGODB_URI;

// Simple RFC3986-style percent-encode
function pctEncode(s: string) {
  return encodeURIComponent(s)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

// build OAuth1 Authorization header (HMAC-SHA1)
function buildOAuthHeader(method: string, rawUrl: string) {
  if (!BRICKLINK_CONSUMER_KEY || !BRICKLINK_CONSUMER_SECRET || !BRICKLINK_OAUTH_TOKEN || !BRICKLINK_OAUTH_TOKEN_SECRET) {
    throw new Error("Missing Bricklink OAuth env variables: BRICKLINK_CONSUMER_KEY/SECRET/OAUTH_TOKEN/OAUTH_TOKEN_SECRET");
  }

  const urlObj = new URL(rawUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  // Collect query params from URL
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((v, k) => {
    // include query params
    params[k] = v;
  });

  // oauth params
  const oauth: Record<string, string> = {
    oauth_consumer_key: BRICKLINK_CONSUMER_KEY!,
    oauth_token: BRICKLINK_OAUTH_TOKEN!,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(8).toString("hex"),
    oauth_version: "1.0",
  };

  // Merge for signing
  const allParams = Object.assign({}, params, oauth);

  // Create normalized param string (sorted by encoded key)
  const keys = Object.keys(allParams).sort();
  const paramParts = keys.map(k => `${pctEncode(k)}=${pctEncode(allParams[k])}`);
  const paramString = paramParts.join("&");

  const baseString = [
    method.toUpperCase(),
    pctEncode(baseUrl),
    pctEncode(paramString)
  ].join("&");

  const signingKey = `${pctEncode(BRICKLINK_CONSUMER_SECRET!)}&${pctEncode(BRICKLINK_OAUTH_TOKEN_SECRET!)}`;

  const hmac = crypto.createHmac("sha1", signingKey);
  hmac.update(baseString);
  const signature = hmac.digest("base64");

  oauth["oauth_signature"] = signature;

  // Build header string
  const headerParts = Object.keys(oauth).sort().map(k => `${pctEncode(k)}="${pctEncode(oauth[k])}"`);
  const authHeader = `OAuth ${headerParts.join(", ")}`;

  return authHeader;
}

// small helper to extract an array of items from a Bricklink response body
function extractItemsFromBody(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (body?.pageSummary && Array.isArray(body.pageSummary.sample)) return body.pageSummary.sample;
  // find first array value
  for (const v of Object.values(body)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Basic param handling
    const debug = req.query.debug === "raw";
    const fast = req.query.fast === "1" || req.query.fast === "true";
    const doImport = req.query.import === "1" || req.query.import === "true";
    const dryRun = req.query.dry === "1" || req.query.dry === "true";
    const sampleSize = parseInt((req.query.sampleSize as string) || "5", 10) || 5;
    const limitParam = parseInt((req.query.limit as string) || "100", 10) || 100;
    const pageLimit = Math.min(Math.max(limitParam, 1), 1000); // clamp

    if (!BRICKLINK_USER_ID) {
      return res.status(400).json({ success: false, message: "Missing BRICKLINK user id (BRICKLINK_USER_ID or BL_USER_ID)" });
    }

    // build a base URL template - we'll add offset per page
    const userId = BRICKLINK_USER_ID;
    const baseLimit = pageLimit;
    const baseUrl = `https://api.bricklink.com/api/store/v1/inventories?user_id=${encodeURIComponent(userId)}&limit=${baseLimit}`;

    // debug=raw should only return the URL and Authorization header (no network calls to BrickLink)
    if (debug) {
      const url = `${baseUrl}&offset=0`;
      try {
        const auth = buildOAuthHeader("GET", url);
        return res.status(200).json({
          success: true,
          url,
          headers: {
            Authorization: auth,
            Accept: "application/json"
          }
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || String(err) });
      }
    }

    // We'll call Bricklink pages iteratively
    const resultsSummary: any = {
      pages: 0,
      itemsProcessed: 0,
      errors: []
    };

    // If import requested, ensure Mongo URI available
    let mongoClient: any = null;
    let productsCollection: any = null;
    if (doImport && !dryRun) {
      if (!MONGODB_URI) {
        return res.status(500).json({ success: false, message: "MONGODB_URI is required to import." });
      }
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db(); // uses DB from URI if present
      productsCollection = db.collection("products"); // writes go to products collection
    }

    // iterate pages
    let offset = 0;
    let keepGoing = true;
    const maxPages = 10000; // safety cap (very large)
    let pageCount = 0;

    while (keepGoing && pageCount < maxPages) {
      pageCount++;
      const url = `${baseUrl}&offset=${offset}`;
      let authHeader: string;
      try {
        authHeader = buildOAuthHeader("GET", url);
      } catch (err: any) {
        resultsSummary.errors.push({ page: pageCount, error: `OAuth build error: ${err.message || String(err)}` });
        break;
      }

      // fetch
      const fetchRes = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json"
        }
      });

      if (!fetchRes.ok) {
        const text = await fetchRes.text().catch(() => "");
        resultsSummary.errors.push({ page: pageCount, status: fetchRes.status, text: text.substring(0, 2000) });
        // stop on non-200
        break;
      }

      const body = await fetchRes.json().catch(() => null);
      const items = extractItemsFromBody(body);
      resultsSummary.pages = pageCount;
      resultsSummary.itemsProcessed += Array.isArray(items) ? items.length : 0;

      // If fast requested, just return the page summary (avoid huge responses)
      if (fast) {
        // include a tiny sample when available
        const sample = Array.isArray(items) ? items.slice(0, sampleSize) : [];
        return res.status(200).json({
          success: true,
          url,
          status: fetchRes.status,
          elapsed: fetchRes.headers.get("x-response-time") || undefined,
          pageSummary: {
            itemsReturned: Array.isArray(items) ? items.length : 0,
            sample
          },
          note: "fast=1 returns only first page summary to avoid huge responses."
        });
      }

      // If doImport requested: upsert items into DB (unless dryRun)
      if (doImport && Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          try {
            // determine unique key - prefer inventory_id if present
            const keyFilter: any = {};
            if (it && (it.inventory_id || it.inventoryId)) {
              keyFilter.inventory_id = it.inventory_id || it.inventoryId;
            } else if (it.item && it.item.no) {
              // fallback composite key
              keyFilter["item.no"] = it.item.no;
              if (it.color_id) keyFilter.color_id = it.color_id;
            } else {
              // last fallback - skip
              continue;
            }

            if (!dryRun && productsCollection) {
              // Upsert full object (native driver so not affected by mongoose strict mode)
              await productsCollection.updateOne(keyFilter, { $set: it }, { upsert: true });
            }
          } catch (err: any) {
            resultsSummary.errors.push({ page: pageCount, itemKey: it && (it.inventory_id || (it.item && it.item.no)) || null, error: String(err?.message || err) });
            // continue processing other items
          }
        }
      }

      // Decide whether to keep going: if items length < page limit, we've reached end
      if (!Array.isArray(items) || items.length === 0 || items.length < baseLimit) {
        keepGoing = false;
      } else {
        offset += baseLimit;
      }
    }

    // close mongo if opened
    if (mongoClient) {
      await mongoClient.close();
    }

    // If we only requested safe dry-run sample, attempt to return a sample
    if (doImport && dryRun) {
      return res.status(200).json({
        success: true,
        message: "dry-run completed (no DB writes).",
        summary: resultsSummary
      });
    }

    // Normal finish
    return res.status(200).json({
      success: true,
      message: "sync finished",
      summary: resultsSummary
    });
  } catch (err: any) {
    console.error("sync-bricklink handler error", err);
    return res.status(500).json({ success: false, error: String(err?.message || err) });
  }
}