// pages/api/products.js
// Full API: list products with filters, supports native collection helper or Mongoose fallback.
// Supports ?collection=minifig to read from products_minifig (non-destructive).

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
    case 'price_asc':  return { price: 1,  name: 1 };
    case 'price_desc': return { price: -1, name: 1 };
    case 'name_asc':
    default:           return { name: 1 };
  }
}

// themeOverrides optional (if you have lib/themeOverrides.json)
let themeOverrides = {};
try {
  //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
  themeOverrides = require('../../lib/themeOverrides.json');
} catch (e) {
  themeOverrides = {};
}
function buildThemeOr(themeKey) {
  const or = [];
  for (const [prefix, key] of Object.entries(themeOverrides.mapPrefix || {})) {
    if (key === themeKey) {
      or.push({ itemNo: { $regex: `^${prefix}`, $options: 'i' } });
    }
  }
  for (const [frag, key] of Object.entries(themeOverrides.mapContains || {})) {
    if (key === themeKey) {
      const esc = frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      or.push({ name: { $regex: esc, $options: 'i' } });
    }
  }
  if (or.length === 0) or.push({ _id: { $exists: false } });
  return or;
}
function buildOtherNor() {
  const allOr = [];
  const knownKeys = Object.values(themeOverrides.mapPrefix || {}).concat(
    Object.values(themeOverrides.mapContains || {})
  );
  const uniqKeys = Array.from(new Set(knownKeys)).filter(k => k !== 'other');
  for (const key of uniqKeys) {
    const or = buildThemeOr(key);
    allOr.push({ $or: or });
  }
  if (allOr.length === 0) return undefined;
  return { $nor: allOr };
}
function buildSeriesFilter(nRaw) {
  const n = parseNumber(nRaw);
  if (!n) return undefined;
  const rx = new RegExp(`Series\\s*${n}\\b`, 'i');
  return { name: { $regex: rx } };
}

// try to load helpers (both optional)
let getProductsCollection = null;
let ProductModel = null;
try {
  //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
  const mod = require('../../lib/getProductsCollection');
  if (mod) {
    if (typeof mod.getProductsCollection === 'function') getProductsCollection = mod.getProductsCollection;
    else if (typeof mod === 'function') getProductsCollection = mod;
  }
} catch (e) {
  getProductsCollection = null;
}
try {
  //  PAYPAL_CLIENT_SECRET_REDACTEDglobal-require
  ProductModel = require('../../models/Product');
  if (ProductModel && ProductModel.default) ProductModel = ProductModel.default;
} catch (e) {
  ProductModel = null;
}

export default async function handler(req, res) {
  try {
    // Pagination
    const page = Math.max(1, parseNumber(req.query.page) ?? 1);
    const limit = Math.max(1, Math.min(200, parseNumber(req.query.limit) ?? 36));
    const skip = (page - 1) * limit;

    // Filters
    const requestedType = (req.query.type || '').toString() || 'MINIFIG';
    const q = (req.query.q || '').toString();
    const cond = (req.query.cond || '').toString();
    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    const theme = (req.query.theme || '').toString();
    const series = req.query.series;
    const includeSoldOut = truthy(req.query.includeSoldOut);
    const onlyInStock = truthy(req.query.onlyInStock) || !includeSoldOut;
    const sort = toSort(req.query.sort);

    // which collection to read: ?collection=minifig or query type as fallback
    const collectionHint = String(req.query.collection || '').toLowerCase();
    const useMinifigCol = collectionHint === 'minifig' || requestedType === 'MINIFIG_ONLY';

    // Build base match (works for usual "products" documents)
    const match = {};

    if (requestedType && requestedType !== 'ALL') {
      // set top-level match.type for the normal path;
      // if we later detect products_minifig, we'll adapt to check item.type too.
      match.type = requestedType;
    }

    if (onlyInStock) match.qty = { $gt: 0 };
    if (cond === 'N' || cond === 'U') match.condition = cond;
    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = minPrice;
      if (maxPrice !== undefined) match.price.$lte = maxPrice;
    }

    // search: default checks top-level name and itemNo
    if (q) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.$or = [
        { name: { $regex: esc, $options: 'i' } },
        { itemNo: { $regex: `^${esc}`, $options: 'i' } }
      ];
    }

    // theme filter
    if (theme) {
      if (theme === 'other') {
        const nor = buildOtherNor();
        if (nor) Object.assign(match, nor);
      } else {
        const or = buildThemeOr(theme);
        if (or && or.length) match.$and = (match.$and || []).concat([{ $or: or }]);
      }
    }

    // series filter
    const seriesFilter = buildSeriesFilter(series);
    if (seriesFilter) match.$and = (match.$and || []).concat([seriesFilter]);

    // If collection is products_minifig, adapt match to accept nested fields
    // - some imports store Bricklink item details in `item.*` rather than top-level fields.
    if (useMinifigCol) {
      // convert any top-level type into a $or checking type OR item.type
      if (match.type) {
        const typeVal = match.type;
        // ensure $and exists
        match.$and = match.$and || [];
        match.$and.push({ $or: [{ type: typeVal }, { 'item.type': typeVal }] });
        delete match.type;
      }
      // adapt search match.$or (include item.name)
      if (match.$or) {
        const newOr = [];
        for (const clause of match.$or) {
          if (clause.name) {
            newOr.push(clause); // top-level name
            newOr.push({ 'item.name': clause.name }); // also search item.name
          } else if (clause.itemNo) {
            newOr.push(clause);
            newOr.push({ 'item.no': clause.itemNo }); // also item.no
          } else {
            newOr.push(clause);
          }
        }
        match.$or = newOr;
      }
      // if no name search, still allow item.name search for q omitted cases (no-op)
    }

    const projection = { createdAt: 0, updatedAt: 0, __v: 0 };

    // Try native collection helper first
    if (getProductsCollection) {
      const collectionName = useMinifigCol ? 'products_minifig' : 'products';
      let col = null;
      try {
        col = await getProductsCollection({ name: collectionName });
      } catch (e) {
        // try no-arg
        col = await getProductsCollection();
      }
      if (!col || typeof col.find !== 'function') {
        throw new Error('getProductsCollection did not return a usable collection');
      }
      const cursor = col.find(match, { projection }).sort(sort).skip(skip).limit(limit);
      const items = await cursor.toArray();
      const count = await col.countDocuments(match);
      return res.status(200).json({
        items,
        count,
        page,
        limit,
        __meta: {
          using: 'native-collection',
          collection: collectionName,
          onlyInStockApplied: !!onlyInStock,
          includeSoldOutApplied: !!includeSoldOut,
          sort,
          requestedType
        }
      });
    }

    // Fallback: Mongoose model path
    if (ProductModel && typeof ProductModel.find === 'function') {
      const model = ProductModel;
      if (useMinifigCol) {
        // read directly from native collection products_minifig using model's DB
        let altCol = null;
        if (model.db && model.db.collection) {
          altCol = model.db.collection('products_minifig');
        } else {
          // last resort: require mongoose connection
          const mongoose = require('mongoose');
          if (!mongoose.connection || !mongoose.connection.db) {
            throw new Error('Cannot access mongoose connection to read alternate collection');
          }
          altCol = mongoose.connection.db.collection('products_minifig');
        }
        const items = await altCol.find(match, { projection }).sort(sort).skip(skip).limit(limit).toArray();
        const count = await altCol.countDocuments(match);
        return res.status(200).json({
          items,
          count,
          page,
          limit,
          __meta: { using: 'mongoose-native-collection', collection: 'products_minifig', requestedType }
        });
      }

      // Normal Mongoose path
      const items = await model.find(match).sort(sort).skip(skip).limit(limit).select(projection).lean();
      const count = await model.countDocuments(match);
      return res.status(200).json({
        items,
        count,
        page,
        limit,
        __meta: {
          using: 'mongoose-model',
          collection: model.collection && model.collection.name ? model.collection.name : 'products',
          onlyInStockApplied: !!onlyInStock,
          includeSoldOutApplied: !!includeSoldOut,
          sort,
          requestedType
        }
      });
    }

    throw new Error('No database helper found (lib/getProductsCollection or models/Product).');
  } catch (err) {
    console.error('products API ERROR:', err && (err.stack || err.message || err));
    res.status(500).json({ error: String(err && (err.message || err)) });
  }
}