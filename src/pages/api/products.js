// pages/api/products.js
'use strict';

/**
 * Robust products API route.
 * - Attempts to use lib/getProductsCollection() (native Mongo collection) if present.
 * - Falls back to models/Product (Mongoose) if present.
 * - Always returns JSON, never HTML.
 */

function parseNumber(v) {
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}
function truthy(v) {
  if (v === undefined) return false;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}
function toSort(sort) {
  const s = String(sort || '');
  switch (s) {
    case 'name_desc':  return { name: -1 };
    case 'price_asc':  return { price: 1, name: 1 };
    case 'price_desc': return { price: -1, name: 1 };
    case 'name_asc':
    default:           return { name: 1 };
  }
}
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let themeOverrides = {};
try {
  // prefer CommonJS require if possible
  //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
  themeOverrides = require('../../lib/themeOverrides.json');
} catch (e) {
  try {
    // fallback to dynamic import
    /* eslint-disable no-await-in-loop */
    (async () => {
      try {
        // try import; note this returns a Promise, we don't strictly need the content synchronously
        const mod = await import('../../lib/themeOverrides.json');
        themeOverrides = mod && (mod.default || mod);
      } catch (_err) { /* ignore */ }
    })();
  } catch (_e) { /* ignore */ }
}

function buildThemeOr(themeKey) {
  const or = [];
  for (const [prefix, key] of Object.entries(themeOverrides.mapPrefix || {})) {
    if (key === themeKey) {
      or.push({ itemNo: { $regex: `^${escapeRegex(prefix)}`, $options: 'i' } });
    }
  }
  for (const [frag, key] of Object.entries(themeOverrides.mapContains || {})) {
    if (key === themeKey) {
      const esc = escapeRegex(frag);
      or.push({ name: { $regex: esc, $options: 'i' } });
    }
  }
  if (or.length === 0) or.push({ _id: { $exists: false } });
  return or;
}
function buildOtherNor() {
  const allOr = [];
  const knownKeys = Object.values(themeOverrides.mapPrefix || {}).concat(Object.values(themeOverrides.mapContains || {}));
  const uniqKeys = Array.from(new Set(knownKeys)).filter(k => k !== 'other');
  for (const key of uniqKeys) {
    allOr.push({ $or: buildThemeOr(key) });
  }
  if (allOr.length === 0) return undefined;
  return { $nor: allOr };
}

/** Try to obtain a native Mongo Collection via lib/getProductsCollection.
 *  This tries require() first (CommonJS), then dynamic import() if needed.
 *  If it returns a collection object, we use it for fast queries.
 */
async function tryGetNativeCollection() {
  try {
    let mod = null;
    try {
      // prefer require (synchronous)
      //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
      mod = require('../../lib/getProductsCollection');
    } catch (e) {
      mod = null;
    }
    if (!mod) {
      try {
        // try ESM path variations
        mod = await import('../../lib/getProductsCollection.js').catch(() => null);
        if (!mod) mod = await import('../../lib/getProductsCollection').catch(() => null);
      } catch (e) {
        mod = null;
      }
    }
    if (!mod) return null;
    const fn = (mod && (mod.getProductsCollection || mod.default || mod));
    if (typeof fn !== 'function') return null;
    // call fn, which should return a native collection (like client.db().collection('products'))
    const col = await fn();
    return col || null;
  } catch (e) {
    return null;
  }
}

/** Try to load a Mongoose model fallback (models/Product). */
async function tryGetMongooseModel() {
  try {
    let mod = null;
    try {
      // CommonJS first
      //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
      mod = require('../../models/Product');
    } catch (e) {
      mod = null;
    }
    if (!mod) {
      try {
        mod = await import('../../models/Product.js').catch(() => null);
        if (!mod) mod = await import('../../models/Product').catch(() => null);
      } catch (e) {
        mod = null;
      }
    }
    if (!mod) return null;
    return (mod && (mod.default || mod)) || mod;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    // pagination
    const page = Math.max(1, parseNumber(req.query.page) ?? 1);
    const limit = Math.max(1, Math.min(72, parseNumber(req.query.limit) ?? 36));
    const skip = (page - 1) * limit;

    // filters
    const type = (req.query.type || 'MINIFIG');
    const q = (req.query.q || '');
    const cond = (req.query.cond || '');
    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    const theme = (req.query.theme || '');
    const series = req.query.series;
    const includeSoldOut = truthy(req.query.includeSoldOut);
    const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut;
    const sort = toSort(req.query.sort);

    const match = {};
    if (type && type !== 'ALL') match.type = type;
    if (onlyInStock) match.qty = { $gt: 0 };
    if (cond === 'N' || cond === 'U') match.condition = cond;
    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = minPrice;
      if (maxPrice !== undefined) match.price.$lte = maxPrice;
    }
    if (q) {
      const esc = escapeRegex(q);
      match.$or = [
        { name: { $regex: esc, $options: 'i' } },
        { itemNo: { $regex: `^${esc}`, $options: 'i' } }
      ];
    }
    if (theme) {
      if (theme === 'other') {
        const nor = buildOtherNor();
        if (nor) Object.assign(match, nor);
      } else {
        const or = buildThemeOr(theme);
        if (or.length) match.$and = (match.$and || []).concat([{ $or: or }]);
      }
    }
    if (series) {
      const n = parseNumber(series);
      if (n) {
        const rx = new RegExp(`Series\\s*${n}\\b`, 'i');
        match.$and = (match.$and || []).concat([{ name: { $regex: rx } }]);
      }
    }

    const projection = { createdAt: 0, updatedAt: 0, __v: 0 };

    // 1) Try native Mongo collection for speed
    const col = await tryGetNativeCollection();
    if (col) {
      // col is expected to be a native Mongo Collection
      const cursor = col.find(match, { projection });
      try { if (typeof cursor.collation === 'function') cursor.collation({ locale: 'en', strength: 1 }); } catch (e) {}
      const qCursor = cursor.sort(sort).skip(skip).limit(limit);
      const [items, count] = await Promise.all([qCursor.toArray(), col.countDocuments(match)]);
      return res.status(200).json({
        items, count, page, limit,
        __meta: {
          typeApplied: type || null,
          themeApplied: theme || null,
          seriesApplied: series ? String(series) : null,
          onlyInStockApplied: !!onlyInStock,
          includeSoldOutApplied: !!includeSoldOut,
          sort: Object.keys(sort)[0] + '_' + (Object.values(sort)[0] === 1 ? 'asc' : 'desc'),
          minPrice: minPrice ?? null, maxPrice: maxPrice ?? null
        }
      });
    }

    // 2) Try Mongoose model fallback
    const ProductModel = await tryGetMongooseModel();
    if (ProductModel && typeof ProductModel.find === 'function') {
      const findQuery = ProductModel.find(match).select(projection).sort(sort).skip(skip).limit(limit).lean();
      try { if (typeof findQuery.collation === 'function') findQuery.collation({ locale: 'en', strength: 1 }); } catch (e) {}
      const [items, count] = await Promise.all([findQuery.exec(), ProductModel.countDocuments(match)]);
      return res.status(200).json({
        items, count, page, limit,
        __meta: {
          typeApplied: type || null,
          themeApplied: theme || null,
          seriesApplied: series ? String(series) : null,
          onlyInStockApplied: !!onlyInStock,
          includeSoldOutApplied: !!includeSoldOut,
          sort: Object.keys(sort)[0] + '_' + (Object.values(sort)[0] === 1 ? 'asc' : 'desc'),
          minPrice: minPrice ?? null, maxPrice: maxPrice ?? null
        }
      });
    }

    // If neither is available, return a clear error message (500)
    return res.status(500).json({ error: 'No products collection helper or model available. Tried lib/getProductsCollection and models/Product.' });
  } catch (err) {
    // Always return JSON for errors
    console.error('/api/products error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
};