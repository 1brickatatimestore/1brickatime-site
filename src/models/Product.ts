import mongoose, { Schema, model, models } from 'mongoose';

export type ProductType = 'MINIFIG' | 'SET' | 'PART';

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  inventoryId: number;             // BrickLink inventory key (unique)
  itemNo: string;                  // e.g. "adp094"
  type: ProductType;               // 'MINIFIG', 'SET', etc.
  categoryId?: number;             // BrickLink category id
  name: string;
  price: number;
  qty: number;
  condition?: 'N' | 'U';           // New/Used (BrickLink style)
  themeKey?: string;               // e.g. 'city'
  seriesKey?: string;              // e.g. '1' for CMF
  imageUrl?: string;
  description?: string;
  remarks?: string;                // your freeform note / BrickLink remarks
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    inventoryId: { type: Number, unique: true, index: true },
    itemNo: { type: String, index: true },
    type: { type: String, index: true },
    categoryId: { type: Number },
    name: { type: String, required: true },        // <-- no `index: true`
    price: { type: Number, required: true },       // <-- no `index: true`
    qty: { type: Number, default: 0, index: true },
    condition: { type: String },
    themeKey: { type: String, index: true },
    seriesKey: { type: String, index: true },
    imageUrl: { type: String },
    description: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Only compound/supporting indexes below (no duplicates of field-level ones)
ProductSchema.index({ type: 1, themeKey: 1 });
ProductSchema.index({ type: 1, seriesKey: 1 });
ProductSchema.index({ type: 1, price: 1 });
ProductSchema.index({ name: 'text', itemNo: 'text', remarks: 'text' }, { name: 'product_text' });

export default (models.Product as mongoose.Model<IProduct>) || model<IProduct>('Product', ProductSchema);