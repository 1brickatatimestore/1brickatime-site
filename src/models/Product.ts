import { Schema, model, models, Document } from 'mongoose'

export interface IProduct extends Document {
  inventoryId: number
  type?: string | null
  categoryId?: number | null
  itemNo?: string | null
  name?: string | null
  condition?: string | null // 'N' or 'U'
  description?: string | null
  remarks?: string | null
  price?: number | null
  qty: number
  imageUrl?: string | null
}

const ProductSchema = new Schema<IProduct>(
  {
    inventoryId: { type: Number, required: true, unique: true },
    type:        { type: String },        // no defaults
    categoryId:  { type: Number },
    itemNo:      { type: String },
    name:        { type: String },
    condition:   { type: String },
    description: { type: String },
    remarks:     { type: String },
    price:       { type: Number },
    qty:         { type: Number, required: true },
    imageUrl:    { type: String },
  },
  { timestamps: true }
)

// Prevent model recompilation in Next.js dev
export default models.Product || model<IProduct>('Product', ProductSchema)