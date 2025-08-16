#!/usr/bin/env node
/**
 * scripts/import_only_minifigs.js
 *
 * Usage:
 *   # make sure MONGODB_URI is exported in this shell (see below)
 *   node scripts/import_only_minifigs.js
 *
 * This imports only minifig items from /tmp/bricklink-last.json
 * into a non-destructive collection: `products_minifig`.
 */

'use strict';

const fs = require('fs');
const { MongoClient } = require('mongodb');

(async function main() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('ERROR: MONGODB_URI not set in environment.');
      process.exit(2);
    }

    const rawPath = '/tmp/bricklink-last.json';
    if (!fs.existsSync(rawPath)) {
      console.error('ERROR: raw file not found at', rawPath);
      process.exit(2);
    }

    const raw = fs.readFileSync(rawPath, 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      console.error('ERROR: failed parsing JSON:', e.message);
      process.exit(2);
    }

    const items = Array.isArray(parsed?.data) ? parsed.data : [];
    console.log('Total items in raw file:', items.length);

    function isMinifig(it) {
      if (!it) return false;
      // primary check: item.type === 'MINIFIG' (case-insensitive)
      if (it.item && String(it.item.type || '').toUpperCase() === 'MINIFIG') return true;
      // fallback: item name contains 'minifig'
      if (typeof it.item?.name === 'string' && /minifig/i.test(it.item.name)) return true;
      if (typeof it.name === 'string' && /minifig/i.test(it.name)) return true;
      // If you know a specific category_id number for minifigs, add it here
      return false;
    }

    const filtered = items.filter(isMinifig);
    console.log('Filtered minifigs count:', filtered.length);

    if (filtered.length === 0) {
      console.log('No minifigs found. Exiting.');
      process.exit(0);
    }

    // connect to Mongo and write to a *separate* collection to avoid touching existing data
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db(); // uses DB from URI
    const col = db.collection('products_minifig');

    // Upsert in batches
    const BATCH = 200;
    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch = filtered.slice(i, i + BATCH);
      const ops = batch.map(it => {
        // choose best unique filter: prefer inventory_id, else item no + color
        if (it.inventory_id) {
          return {
            updateOne: {
              filter: { inventory_id: it.inventory_id },
              update: { $set: it },
              upsert: true
            }
          };
        } else {
          const itemNo = it.item?.no ?? it.item_no ?? null;
          const color = it.color_id ?? null;
          if (itemNo) {
            return {
              updateOne: {
                filter: { itemNo: itemNo, color_id: color },
                update: { $set: it },
                upsert: true
              }
            };
          } else {
            return null; // skip items with no usable key
          }
        }
      }).filter(Boolean);

      if (ops.length === 0) { console.log('batch', i, 'skipped (no usable keys)'); continue; }

      try {
        const res = await col.bulkWrite(ops, { ordered: false });
        console.log(`imported batch ${i}-${i + batch.length - 1} upserted:${res.upsertedCount} modified:${res.modifiedCount}`);
      } catch (e) {
        console.error('bulkWrite failed for batch', i, '-', i + batch.length - 1, e && (e.message || e));
      }
    }

    await client.close();
    console.log('Done. products_minifig collection ready.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();