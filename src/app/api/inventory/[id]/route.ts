import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();

    try {
        const { id } = await params;
        const body = await req.json();

        const inventory = await Inventory.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        if (!inventory) {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
        }

        return NextResponse.json(inventory);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
    }
}

// Adjust stock (increment/decrement)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();

    try {
        const { id } = await params;
        const { adjustment } = await req.json(); // positive or negative number

        const inventory = await Inventory.findByIdAndUpdate(
            id,
            { $inc: { quantity: adjustment } },
            { new: true }
        );

        if (!inventory) {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
        }

        return NextResponse.json(inventory);
    } catch (error) {
        return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
    }
}
