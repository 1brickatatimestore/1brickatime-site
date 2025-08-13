import mongoose, { Schema, model, models } from 'mongoose'

const LineItemSchema = new Schema(
  {
    inventoryId: { type: Number, index: true }, // BrickLink Inventory ID if known
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    sku: String, // whatever we sent to PayPal
    name: String,
    price: Number,
    qty: Number,
    imageUrl: String,
  },
  { _id: false }
)

const TotalsSchema = new Schema(
  {
    items: Number,
    postage: Number,
    shipping: Number,
    total: Number,
    currency: String,
  },
  { _id: false }
)

const PayerSchema = new Schema(
  {
    payerId: String,
    email: String,
    givenName: String,
    surname: String,
    country: String,
  },
  { _id: false }
)

const OrderSchema = new Schema(
  {
    provider: { type: String, default: 'paypal' },
    orderId: { type: String, index: true },   // PayPal order id
    captureId: { type: String, index: true }, // PayPal capture id (first capture)
    status: { type: String, index: true },    // COMPLETED, etc

    items: [LineItemSchema],
    totals: TotalsSchema,
    payer: PayerSchema,

    raw: Schema.Types.Mixed, // trimmed PayPal payload (optional)
  },
  { timestamps: true }
)

OrderSchema.index({ createdAt: -1 })

export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema>
export default (models.Order as mongoose.Model<OrderDoc>) || model('Order', OrderSchema)