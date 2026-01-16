import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
    menuItemId: mongoose.Types.ObjectId; // Reference to MenuItem
    name: string; // Store name snapshot
    price: number; // Store price snapshot
    quantity: number;
}

export interface IOrder extends Document {
    type: 'dine-in' | 'pickup';
    tableNumber?: number; // Required for dine-in
    items: IOrderItem[];
    status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'rejected' | 'delivered';
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema({
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const OrderSchema: Schema = new Schema({
    type: { type: String, enum: ['dine-in', 'pickup'], required: true },
    tableNumber: { type: Number }, // Validation logic in controller
    items: [OrderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'completed', 'rejected', 'delivered'],
        default: 'pending'
    },
    totalAmount: { type: Number, required: true },
}, { timestamps: true });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
