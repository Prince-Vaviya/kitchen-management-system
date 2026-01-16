import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    role: 'counter' | 'waiter' | 'kitchen';
    password?: string; // Optional if we want to allow guest access or just simple PINs? User said "profile", implies login.
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['counter', 'waiter', 'kitchen'], required: true },
}, { timestamps: true });

// Prevent overwrite error in HMR
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
