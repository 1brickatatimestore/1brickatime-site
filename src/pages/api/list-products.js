// pages/api/list-products.js
'use strict';

/**
 * Thin shim to preserve older frontend calls to /api/list-products.
 * Delegates to pages/api/products.js
 */

module.exports = async function handler(req, res) {
  try {
    // Prefer require() in CommonJS; fallback to import()
    let prodMod = null;
    try {
      prodMod = require('./products.js');
    } catch (e) {
      try {
        prodMod = (await import('./products.js')).default;
      } catch (e2) {
        prodMod = null;
      }
    }
    // If require('./products.js') returned the handler directly, use it
    const fn = (prodMod && (prodMod.default || prodMod)) || prodMod;
    if (!fn || typeof fn !== 'function') {
      return res.status(500).json({ error: 'Products handler not available' });
    }
    return await fn(req, res);
  } catch (err) {
    console.error('/api/list-products error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
};