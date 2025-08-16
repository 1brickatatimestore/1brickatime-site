// src/models/Product.ts
import mongoose, { Schema, model, models, InferSchemaType } from 'mongoose'

const COLLECTION = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'products'

const ProductSchema = new Schema(
  {
    itemNo: { type: String, index: true },
    inventoryId: { type: Number, index: true },

    name: { type: String },
    type: { type: String, index: true },
    condition: { type: String },
    remarks: { type: String },
    language: { type: String },

    themeKey: { type: String, index: true },
    seriesKey: { type: String, index: true },

    price: { type: Number },
    qty: { type: Number, index: true },

    imageUrl: { type: String },
  },
  {
    versionKey: false,
    timestamps: false,
    collection: COLLECTION,
  }
)

ProductSchema.index(
  { inventoryId: 1 },
  {
    name: 'inventoryId_1',
    unique: true,
    partialFilterExpression: { inventoryId: { $gt: 0 } },
  }
)

ProductSchema.index(
  { itemNo: 1 },
  {
    name: 'itemNo_1',
    unique: true,
    partialFilterExpression: { itemNo: { $type: 'string' } },
  }
)

ProductSchema.index({ type: 1, themeKey: 1 }, { name: 'type_1_themeKey_1' })
ProductSchema.index({ type: 1, seriesKey: 1 }, { name: 'type_1_seriesKey_1' })
ProductSchema.index({ type: 1, price: 1 }, { name: 'type_1_price_1' })
ProductSchema.index({ type: 1 }, { name: 'type_1' })
ProductSchema.index({ seriesKey: 1 }, { name: 'seriesKey_1' })
ProductSchema.index({ themeKey: 1 }, { name: 'themeKey_1' })
ProductSchema.index({ qty: 1 }, { name: 'qty_1' })

ProductSchema.index(
  { itemNo: 'text', name: 'text', remarks: 'text' },
  {
    name: 'product_text',
    default_language: 'english',
    language_override: 'language',
    weights: { itemNo: 1, name: 1, remarks: 1 },
  }
)

export type ProductDoc = InferSchemaType<typeof ProductSchema>

const modelName = `Product_${COLLECTION}`

export default (models[modelName] as mongoose.Model<ProductDoc>) ||
  model<ProductDoc>(modelName, ProductSchema)