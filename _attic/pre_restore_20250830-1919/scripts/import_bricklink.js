/**
 * scripts/import_bricklink.js
 *
 * Usage examples:
 *   # dry-run first 10 items
 *   set -a; [ -f .env.local ] && source .env.local; set +a
 *   node scripts/import_bricklink.js --file /tmp/bricklink-last.json --dry --limit 10
 *
 *   # real import (be sure MONGODB_URI exported)
 *   set -a; [ -f .env.local ] && source .env.local; set +a
 *   node scripts/import_bricklink.js --file /tmp/bricklink-last.json --batch 500
 */
const fs = require('fs');
const { MongoClient } = require('mongodb');

function parseArgs() {
  const argv = require('minimist')(process.argv.slice(2), {
    string: ['file', 'collection'],
    boolean: ['dry'],
    default: { file: '/tmp/bricklink-last.json', batch: 500, dry: false, collection: 'products', limit: 0 }
  });
  return argv;
}

function normalizeItem(it) {
  // Defensive normalizing / trimming before saving
  return {
    inventory_id: it.inventory_id,
    item_no: (it.item?.no ?? it.item_no ?? '').toString(),
    item_name: it.item?.name ?? null,
    color_id: it.color_id ?? null,
    color_name: it.color_name ?? null,
    quantity: Number.isFinite(+it.quantity) ? parseInt(it.quantity, 10) : (it.quantity ?? 0),
    unit_price: (it.unit_price == null || it.unit_price === '') ? null : parseFloat(String(it.unit_price)),
    new_or_used: it.new_or_used ?? null,
    bind_id: it.bind_id ?? null,
    description: it.description ?? null,
    date_created: it.date_created ? new Date(it.date_created) : null,
    raw: it // keep raw payload for debugging (optional)
  };
}

async function main() {
  const argv = parseArgs();
  const file = argv.file;
  const BATCH = parseInt(argv.batch, 10) || 500;
  const DRY = !!argv.dry;
  const limit = parseInt(argv.limit, 10) || 0;
  const COLLECTION = argv.collection || 'products';

  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }

  console.log('Reading file:', file);
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('JSON parse error:', err.message);
    process.exit(2);
  }

  const items = Array.isArray(parsed?.data) ? parsed.data : [];
  const totalItems = limit > 0 ? Math.min(limit, items.length) : items.length;
  console.log(`Found ${items.length} items in file; will process ${totalItems}${DRY ? ' (dry-run)' : ''}`);

  if (totalItems === 0) {
    console.log('No items to import; exiting.');
    return;
  }

  if (DRY) {
    // Print first few normalized items and exit
    const sample = items.slice(0, Math.min(10, totalItems)).map(normalizeItem);
    console.log('Dry-run sample (normalized):', JSON.stringify(sample, null, 2));
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment. Load .env.local or export it.');
    process.exit(2);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(); // uses DB from URI if provided
    const col = db.collection(COLLECTION);

    console.log('Connected to Mongo, collection:', COLLECTION);
    console.log('RECOMMENDATION: ensure index on inventory_id for fast upserts:');
    console.log('  db.' + COLLECTION + '.createIndex({ inventory_id: 1 }, { unique: true })');

    let processed = 0;
    for (let i = 0; i < totalItems; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      const ops = batch.map(it => {
        const doc = normalizeItem(it);
        return {
          updateOne: {
            filter: { inventory_id: doc.inventory_id },
            update: { $set: doc },
            upsert: true
          }
        };
      });

      // attempt upsert with retry for transient errors
      const attemptBulk = async (retry = 0) => {
        try {
          const res = await col.bulkWrite(ops, { ordered: false });
          console.log(`Batch ${i}-${i + batch.length - 1} bulkWrite ok: upserted=${res.upsertedCount || 0} modified=${res.modifiedCount || 0}`);
        } catch (err) {
          if (retry < 3 && (err && (err.message && /timed out|retryable|network|ECONN|exceeded/i.test(err.message)))) {
            const wait = 1000 * Math.pow(2, retry);
            console.warn(`bulkWrite transient error, retry ${retry + 1} after ${wait}ms:`, err.message);
            await new Promise(r => setTimeout(r, wait));
            return attemptBulk(retry + 1);
          }
          console.error('bulkWrite failed:', err);
          throw err;
        }
      };

      await attemptBulk();
      processed += batch.length;
      console.log(`Progress: ${processed}/${totalItems}`);
    }
    console.log('Import complete. Processed:', processed);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Fatal error', err && (err.stack || err.message || err));
  process.exit(1);
});
