// pages/api/list-products.js
// Compatibility shim: forwards to /api/products handler
// If you prefer list-products to always use minifig collection, uncomment the forced line below.

import productsHandler from './products';

export default async function handler(req, res) {
  // Force using the products_minifig collection for this endpoint if you want:
  // req.query.collection = req.query.collection || 'minifig';
  return productsHandler(req, res);
}