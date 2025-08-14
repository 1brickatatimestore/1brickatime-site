import mongoose, { Schema, model, models } from 'mongoose';

export interface IPayPalOrder {
  _id?: mongoose.Types.ObjectId;
  orderId: string;               // PP order id (unique)
  captureId?: string;            // PP capture id (refundable)
  payerId?: string;
  buyerEmail?: string;
  status?: string;               // COMPLETED, etc.

  // What we saved from your cart:
  items: Array<{
    inventoryId?: number;
    itemNo?: string;
    name: string;
    qty: number;
    price: number;
  }>;

  postage?: { id: string; label: string; price: number };
  shipping?: { id: string; label: string; price: number; selected?: boolean };

  totalAmount?: number;
  raw?: any;                     // original PP response (optional)
  createdAt?: Date;
  updatedAt?: Date;
}

const PayPalOrderSchema = new Schema<IPayPalOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    captureId: { type: String, index: true },
    payerId: { type: String },
    buyerEmail: { type: String, index: true },
    status: { type: String },

    items: [
      {
        inventoryId: { type: Number },
        itemNo: { type: String },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    postage: {
      id: String,
      label: String,
      price: Number,
    },
    shipping: {
      id: String,
      label: String,
      price: Number,
      selected: Boolean,
    },

    totalAmount: { type: Number },
    raw: {}, // keep flexible
  },
  { timestamps: true }
);

// Helpful additional indexes (not duplicating field-level ones)
PayPalOrderSchema.index({ createdAt: -1 });
PayPalOrderSchema.index({ status: 1, createdAt: -1 });

export default (models.PayPalOrder as mongoose.Model<IPayPalOrder>) ||
  model<IPayPalOrder>('PayPalOrder', PayPalOrderSchema);