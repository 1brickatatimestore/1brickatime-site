// scripts/enrich_minifigs_from_products.js
// Build products_minifig_enriched by looking up details from the products collection.
require('dotenv').config({ path: process. PAYPAL_CLIENT_SECRET_REDACTED|| '.env.local' });
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'bricklink';
  const srcName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products_minifig';
  const prodName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products';
  const outName = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products_minifig_enriched';

  if (!uri) throw new Error('MONGODB_URI missing');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const pipeline = [
    { $addFields: { joinNo: { $ifNull: ['$itemNo', '$no'] } } },
    {
      $lookup: {
        from: prodName,
        let: { j: '$joinNo' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$itemNo', '$$j'] },
                  { $eq: ['$no', '$$j'] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 0,
              itemNo: 1, no: 1, name: 1,
              theme: 1, themeName: 1,
              price: 1, priceCents: 1,
              imageUrl: 1, mainImage: 1, blImageUrl: 1, images: 1,
              stock: 1, qty: 1, quantity: 1
            }
          }
        ],
        as: 'p'
      }
    },
    { $addFields: { p: { $first: '$p' } } },
    {
      $addFields: {
        itemNo: { $ifNull: ['$itemNo', { $ifNull: ['$no', { $ifNull: ['$p.itemNo', '$p.no'] }] }] },
        name:   { $ifNull: ['$name', '$p.name'] },
        theme:  { $ifNull: ['$theme', { $ifNull: ['$themeName', { $ifNull: ['$p.theme', '$p.themeName'] }] }] },

        imageUrl: {
          $ifNull: [
            '$imageUrl',
            {
              $ifNull: [
                '$mainImage',
                {
                  $ifNull: [
                    '$blImageUrl',
                    {
                      $ifNull: [
                        '$p.imageUrl',
                        {
                          $ifNull: [
                            '$p.mainImage',
                            { $ifNull: ['$p.blImageUrl', { $arrayElemAt: ['$p.images', 0] }] }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },

        priceCents: {
          $cond: [
            { $gt: [{ $ifNull: ['$priceCents', 0] }, 0] },
            '$priceCents',
            {
              $cond: [
                { $gt: [{ $ifNull: ['$p.priceCents', 0] }, 0] },
                '$p.priceCents',
                { $multiply: [{ $ifNull: ['$price', { $ifNull: ['$p.price', 0] }] }, 100] }
              ]
            }
          ]
        },

        stock: {
          $ifNull: [
            '$stock',
            {
              $ifNull: [
                '$qty',
                {
                  $ifNull: [
                    '$quantity',
                    {
                      $ifNull: [
                        '$p.stock',
                        { $ifNull: ['$p.qty', { $ifNull: ['$p.quantity', 0] }] }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      $addFields: {
        price: {
          $cond: [
            { $gt: ['$priceCents', 0] },
            { $divide: ['$priceCents', 100] },
            { $ifNull: ['$price', 0] }
          ]
        }
      }
    },
    { $project: { p: 0, joinNo: 0 } },
    {
      $merge: {
        into: outName,
        on: '_id',
        whenMatched: 'replace',
        whenNotMatched: 'insert'
      }
    }
  ];

  console.log(`Enriching ${srcName} -> ${outName} using ${prodName} …`);
  await db.collection(srcName).aggregate(pipeline, { allowDiskUse: true }).toArray();
  const count = await db.collection(outName).countDocuments({});
  console.log(`Done. ${outName} docs: ${count}`);

  await client.close();
})().catch(err => { console.error(err); process.exit(1); });