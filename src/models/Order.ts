// src/models/Order.ts
import mongoose, { Schema, models, model } from 'mongoose'

const OrderItemSchema = new Schema(
  {
    inventoryId: { type: Number, required: true },
    itemNo: { type: String, default: null },
    name: { type: String, default: null },
    imageUrl: { type: String, default: null },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const OrderSchema = new Schema(
  {
    method: { type: String, enum: ['BANK', 'PAYPAL', 'STRIPE'], required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    status: { type: String, default: 'PENDING' }, // PENDING, PAID, CANCELED
    contact: {
      email: { type: String, default: null },
      name: { type: String, default: null },
      notes: { type: String, default: null },
    },
  },
  { timestamps: true }
)

export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema>

export default models.Order || model('Order', OrderSchema)