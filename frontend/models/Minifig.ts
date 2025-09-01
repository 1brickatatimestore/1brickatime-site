// src/models/Minifig.ts
import mongoose from 'mongoose';

const MinifigSchema = new mongoose.Schema({
  figNumber: { type: String, required: true },
  name: String,
  imageUrl: String,
  condition: String,
  price: Number,
  description: String,
  remark: String,
});

export default mongoose.models.Minifig || mongoose.model('Minifig', MinifigSchema);
