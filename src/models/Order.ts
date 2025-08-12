// src/models/Order.ts
import mongoose from 'mongoose';

const Item = new mongoose.Schema({
  itemNo: String,
  name: String,
  price: Number,
  qty: { type: Number, default: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  paymentMethod: { type: String, enum: ['bank', 'stripe', 'paypal'], required: true },
  status: { type: String, default: 'pending' },
  items: [Item],
  total: Number,
  customer: {
    name: String,
    email: String,
    notes: String,
  },
}, { timestamps: true });

export default (mongoose.models.Order as any) || mongoose.model('Order', OrderSchema);