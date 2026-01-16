import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";

// Check if order items can be fulfilled based on inventory
export async function POST(req: Request) {
    await dbConnect();

    try {
        const { items } = await req.json(); // Array of { menuItemId, quantity }

        const menuItems = await MenuItem.find({
            _id: { $in: items.map((i: any) => i.menuItemId) }
        }).populate('ingredients.inventoryId');

        const stockIssues: Array<{ item: string; ingredient: string; available: number; needed: number }> = [];

        for (const orderItem of items) {
            const menuItem = menuItems.find((m: any) => m._id.toString() === orderItem.menuItemId);
            if (!menuItem) continue;

            for (const ing of menuItem.ingredients) {
                const inventory = ing.inventoryId as any;
                const needed = ing.quantityUsed * orderItem.quantity;

                if (inventory && inventory.quantity < needed) {
                    stockIssues.push({
                        item: menuItem.name,
                        ingredient: inventory.name,
                        available: inventory.quantity,
                        needed: needed
                    });
                }
            }
        }

        return NextResponse.json({
            canFulfill: stockIssues.length === 0,
            issues: stockIssues
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check inventory" }, { status: 500 });
    }
}
