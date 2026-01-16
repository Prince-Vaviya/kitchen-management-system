import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MealPlan from "@/models/MealPlan";

export async function GET() {
    await dbConnect();
    const mealPlans = await MealPlan.find({ isAvailable: true })
        .populate('items.menuItemId')
        .sort({ category: 1, price: 1 });
    return NextResponse.json(mealPlans);
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const mealPlan = await MealPlan.create(body);
        return NextResponse.json(mealPlan, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });
    }
}
