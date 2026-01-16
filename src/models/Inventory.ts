import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventory extends Document {
    name: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    category: 'ingredient' | 'packaging' | 'other';
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema: Schema<IInventory> = new Schema({
    name: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    lowStockThreshold: { type: Number, required: true, default: 10 },
    category: {
        type: String,
        enum: ['ingredient', 'packaging', 'other'],
        default: 'ingredient'
    },
}, { timestamps: true });

// Virtual for stock status
InventorySchema.virtual('stockStatus').get(function (this: IInventory) {
    if (this.quantity <= 0) return 'out';
    if (this.quantity <= this.lowStockThreshold) return 'low';
    return 'ok';
});

InventorySchema.set('toJSON', { virtuals: true });

const Inventory: Model<IInventory> = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
export default Inventory;
