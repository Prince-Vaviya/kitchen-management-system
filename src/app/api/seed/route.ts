import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import MenuItem from "@/models/MenuItem";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    await dbConnect();

    // Create Users
    const password = await bcrypt.hash("123456", 10);

    const users = [
        { username: "counter", role: "counter", password },
        { username: "waiter", role: "waiter", password },
        { username: "kitchen", role: "kitchen", password },
    ];

    for (const u of users) {
        await User.findOneAndUpdate({ username: u.username }, u, { upsert: true });
    }

    // Create Menu Items
    const items = [
        { name: "Burger", price: 10, category: "Fast Food", isAvailable: true },
        { name: "Pizza", price: 15, category: "Fast Food", isAvailable: true },
        { name: "Soda", price: 3, category: "Drinks", isAvailable: true },
        { name: "Salad", price: 8, category: "Healthy", isAvailable: true },
    ];

    for (const item of items) {
        await MenuItem.findOneAndUpdate({ name: item.name }, item, { upsert: true });
    }

    return NextResponse.json({ message: "Database seeded successfully" });
}
