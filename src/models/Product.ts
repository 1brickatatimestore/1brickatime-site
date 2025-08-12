import mongoose, { Schema, Model, models } from 'mongoose'

export interface IProduct {
  inventoryId: number
  type?: 'MINIFIG' | 'PART' | 'SET' | string | null
  categoryId?: number | null
  itemNo?: string | null
  name?: string | null
  condition?: string | null
  description?: string | null
  remarks?: string | null
  price?: number | null
  qty: number
  imageUrl?: string | null
}

const ProductSchema = new Schema<IProduct>(
  {
    inventoryId: { type: Number, required: true, unique: true },
    type:        { type: String, index: true, default: null },
    categoryId:  { type: Number, default: null },
    itemNo:      { type: String, index: true, default: null },
    name:        { type: String, default: null },
    condition:   { type: String, default: null },
    description: { type: String, default: null },
    remarks:     { type: String, default: null },
    price:       { type: Number, default: null },
    qty:         { type: Number, default: 0 },
    imageUrl:    { type: String, default: null },
  },
  { timestamps: true }
)

// Helpful compound indexes for your typical filters/sorts
ProductSchema.index({ type: 1, updatedAt: -1 })
ProductSchema.index({ type: 1, itemNo: 1 })
ProductSchema.index({ name: 'text', itemNo: 'text', remarks: 'text', description: 'text' })

const Product: Model<IProduct> = models.Product || mongoose.model<IProduct>('Product', ProductSchema)
export default Product