// src/models/Product.ts
import mongoose, { Schema, models, model } from 'mongoose'

export interface IProduct {
  _id?: any
  inventoryId?: number            // BrickLink inventory id (if present)
  categoryId?: number
  type?: 'MINIFIG' | 'SET' | 'PART' | 'GEAR' | string
  itemNo?: string
  name?: string
  condition?: 'N' | 'U' | string
  price?: number
  qty?: number
  imageUrl?: string
  remarks?: string                // BrickLink remarks (free text)
  description?: string            // BrickLink description (HTML or text)
  createdAt?: Date
  updatedAt?: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    inventoryId: { type: Number, index: true },
    categoryId:  { type: Number, index: true },
    type:        { type: String, index: true },
    itemNo:      { type: String, index: true },
    name:        { type: String, index: true },
    condition:   { type: String, index: true },
    price:       { type: Number, index: true },
    qty:         { type: Number, default: 0, index: true },
    imageUrl:    { type: String },
    remarks:     { type: String },
    description: { type: String },
  },
  { timestamps: true }
)

// Helpful indexes for search/sort
ProductSchema.index({ type: 1, qty: -1 })
ProductSchema.index({ name: 1 })
ProductSchema.index({ price: 1 })

// Avoid recompiling model in dev
const Product = models.Product || model<IProduct>('Product', ProductSchema)
export default Product