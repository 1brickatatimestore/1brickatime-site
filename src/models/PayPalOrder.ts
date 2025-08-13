import mongoose, { Schema, model, models } from 'mongoose'

export interface IPayPalCapture {
  captureId: string
  status: string
  amount: { currency_code: string; value: string }
  create_time?: string
  update_time?: string
}

export interface IPayPalOrder {
  orderId: string
  intent?: string
  status: string
  payerEmail?: string
  payerName?: string
  grossAmount?: { currency_code: string; value: string }
  captures: IPayPalCapture[]
  raw: any
  createdAt: Date
  updatedAt: Date
}

const CaptureSchema = new Schema<IPayPalCapture>(
  {
    captureId: { type: String, index: true },
    status: String,
    amount: { currency_code: String, value: String },
    create_time: String,
    update_time: String,
  },
  { _id: false }
)

const OrderSchema = new Schema<IPayPalOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    intent: String,
    status: String,
    payerEmail: String,
    payerName: String,
    grossAmount: { currency_code: String, value: String },
    captures: [CaptureSchema],
    raw: Schema.Types.Mixed,
  },
  { timestamps: true }
)

export default models.PayPalOrder || model<IPayPalOrder>('PayPalOrder', OrderSchema)