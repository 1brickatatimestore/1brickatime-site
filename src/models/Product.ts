// src/models/Product.ts
import mongoose, { Schema, model, models } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    remarks: String,
    condition: String,
    type: String,
    qty: Number,
    itemNo: String,
    theme: String,
  },
  { timestamps: true }
);

export default models.Product || model("Product", productSchema);