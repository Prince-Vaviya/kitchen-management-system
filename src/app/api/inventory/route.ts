import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";

export async function GET() {
    await dbConnect();
    const inventory = await Inventory.find().sort({ category: 1, name: 1 });
    return NextResponse.json(inventory);
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const item = await Inventory.create(body);
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
    }
}
