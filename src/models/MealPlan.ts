import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMealPlanItem {
    menuItemId: mongoose.Types.ObjectId;
    quantity: number;
}

export interface IMealPlan extends Document {
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    items: IMealPlanItem[];
    image: string;
    category: 'value' | 'family' | 'kids' | 'premium';
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MealPlanItemSchema = new Schema({
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, default: 1 },
});

const MealPlanSchema: Schema<IMealPlan> = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    items: [MealPlanItemSchema],
    image: { type: String, default: '🍔' },
    category: {
        type: String,
        enum: ['value', 'family', 'kids', 'premium'],
        default: 'value'
    },
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

// Virtual for savings percentage
MealPlanSchema.virtual('savingsPercent').get(function (this: IMealPlan) {
    if (this.originalPrice <= 0) return 0;
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

MealPlanSchema.set('toJSON', { virtuals: true });

const MealPlan: Model<IMealPlan> = mongoose.models.MealPlan || mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);
export default MealPlan;
