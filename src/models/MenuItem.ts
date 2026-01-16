import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIngredientUsage {
    inventoryId: mongoose.Types.ObjectId;
    quantityUsed: number;
}

export interface IMenuItem extends Document {
    name: string;
    price: number;
    category: string;
    image: string;
    description: string;
    ingredients: IIngredientUsage[];
    isAvailable: boolean;
}

const IngredientUsageSchema = new Schema({
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantityUsed: { type: Number, required: true, default: 1 },
});

const MenuItemSchema: Schema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: '🍔' },
    description: { type: String, default: '' },
    ingredients: [IngredientUsageSchema],
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const MenuItem: Model<IMenuItem> = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export default MenuItem;

