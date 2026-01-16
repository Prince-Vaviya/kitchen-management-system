import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMenuItem extends Document {
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
}

const MenuItemSchema: Schema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // e.g., 'Starters', 'Main Course', 'Drinks'
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const MenuItem: Model<IMenuItem> = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export default MenuItem;
