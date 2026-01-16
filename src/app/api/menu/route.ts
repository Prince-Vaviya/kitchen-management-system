import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";

export async function GET() {
    await dbConnect();
    const items = await MenuItem.find({ isAvailable: true });
    return NextResponse.json(items);
}
