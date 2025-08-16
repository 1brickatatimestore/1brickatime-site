// lib/ProductMinifigModel.js
const mongoose = require('mongoose');
let ProductMinifig = null;

try {
  const base = require('../models/Product'); // your Product model file
  // Reuse the schema if available
  const Schema = base && (base.schema || base._schema || null) || null;
  if (Schema) {
    ProductMinifig = mongoose.models.ProductMinifig || mongoose.model('ProductMinifig', Schema, 'products_minifig');
  }
} catch (e) {
  // fallback: you can define a small schema if needed
  // console.warn('Could not create ProductMinifig model from existing model', e);
}

module.exports = ProductMinifig;