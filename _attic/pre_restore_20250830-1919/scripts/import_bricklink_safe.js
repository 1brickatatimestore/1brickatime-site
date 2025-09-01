/*
  Safe importer (dry-run support). Usage examples:
    node scripts/import_bricklink_safe.js /tmp/bricklink-last.json --batch=100 --dry
    node scripts/import_bricklink_safe.js /tmp/bricklink-last.json --batch=100
*/
const fs = require('fs');
const { MongoClient } = require('mongodb');
const argv = require('minimist')(process.argv.slice(2), { default: { batch: 500, dry: false } });

(async function main(){
  const file = argv._[0] || '/tmp/bricklink-last.json';
  if (!fs.existsSync(file)) { console.error('file not found:', file); process.exit(2); }
  const raw = fs.readFileSync(file,'utf8');
  let parsed;
  try { parsed = JSON.parse(raw); } catch(e){ console.error('JSON parse error', e.message); process.exit(2); }
  const items = Array.isArray(parsed?.data) ? parsed.data : [];
  console.log('Found', items.length, 'items; batch size', argv.batch, 'dry run:', !!argv.dry);

  if (argv.dry) {
    const sample = items.slice(0,5).map(it=>{
      const filter = it.inventory_id ? { inventory_id: it.inventory_id } : (it.item?.no ? { itemNo: it.item.no, color_id: it.color_id ?? null } : null);
      return { filter, update: { $set: it }, upsert: true };
    });
    console.log('Sample ops (dry-run):', sample);
    process.exit(0);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in env'); process.exit(2); }
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const BATCH = Number(argv.batch) || 500;
  for (let i=0; i<items.length; i+=BATCH){
    const batch = items.slice(i, i+BATCH);
    const ops = batch.map(it => {
      if (it.inventory_id) {
        return { updateOne: { filter: { inventory_id: it.inventory_id }, update: { $set: it }, upsert: true } };
      } else {
        const itemNo = it.item?.no ?? it.item_no ?? null;
        const color = it.color_id ?? null;
        if (itemNo) {
          return { updateOne: { filter: { itemNo: itemNo, color_id: color }, update: { $set: it }, upsert: true } };
        } else {
          return null; // skip undocumented keyless items
        }
      }
    }).filter(Boolean);

    if (ops.length === 0) { console.log('batch', i, 'skipped (no usable keys)'); continue; }

    try {
      const res = await col.bulkWrite(ops, { ordered: false });
      console.log(`imported batch ${i}-${i+batch.length-1}`, 'upserted:', res.upsertedCount, 'modified:', res.modifiedCount);
    } catch (e) {
      console.error('bulkWrite failed for batch', i, '-', i+batch.length-1, e && (e.message || e));
      if (e && e.writeErrors && e.writeErrors.length) {
        console.error('writeErrors example:', e.writeErrors.slice(0,5).map(w => ({ index:w.index, errmsg:w.errmsg, code:w.code })));
      }
    }
  }

  await client.close();
  console.log('import finished');
})().catch(err=>{ console.error('Fatal error', err); process.exit(1); });
