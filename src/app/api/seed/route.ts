import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import MenuItem from "@/models/MenuItem";
import Inventory from "@/models/Inventory";
import MealPlan from "@/models/MealPlan";
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

    // Create Inventory Items
    const inventoryItems = [
        { name: "Burger Patty", quantity: 50, unit: "pcs", lowStockThreshold: 10, category: "ingredient" },
        { name: "Burger Buns", quantity: 60, unit: "pcs", lowStockThreshold: 15, category: "ingredient" },
        { name: "Cheese Slice", quantity: 100, unit: "pcs", lowStockThreshold: 20, category: "ingredient" },
        { name: "Lettuce", quantity: 30, unit: "pcs", lowStockThreshold: 10, category: "ingredient" },
        { name: "Tomato", quantity: 40, unit: "pcs", lowStockThreshold: 10, category: "ingredient" },
        { name: "French Fries", quantity: 80, unit: "portions", lowStockThreshold: 20, category: "ingredient" },
        { name: "Chicken Nuggets", quantity: 100, unit: "pcs", lowStockThreshold: 25, category: "ingredient" },
        { name: "Pizza Dough", quantity: 25, unit: "pcs", lowStockThreshold: 8, category: "ingredient" },
        { name: "Mozzarella", quantity: 40, unit: "portions", lowStockThreshold: 10, category: "ingredient" },
        { name: "Pepperoni", quantity: 60, unit: "portions", lowStockThreshold: 15, category: "ingredient" },
        { name: "Soda Syrup", quantity: 20, unit: "liters", lowStockThreshold: 5, category: "ingredient" },
        { name: "Ice Cream", quantity: 30, unit: "scoops", lowStockThreshold: 10, category: "ingredient" },
        { name: "Salad Mix", quantity: 25, unit: "portions", lowStockThreshold: 8, category: "ingredient" },
    ];

    const inventoryMap: Record<string, string> = {};
    for (const inv of inventoryItems) {
        const doc = await Inventory.findOneAndUpdate({ name: inv.name }, inv, { upsert: true, new: true });
        inventoryMap[inv.name] = doc._id.toString();
    }

    // Create Menu Items with ingredients
    const menuItems = [
        {
            name: "Classic Burger", price: 8, category: "Burgers", image: "🍔",
            description: "Juicy beef patty with fresh veggies",
            ingredients: [
                { inventoryId: inventoryMap["Burger Patty"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Burger Buns"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Lettuce"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Tomato"], quantityUsed: 1 },
            ]
        },
        {
            name: "Cheese Burger", price: 10, category: "Burgers", image: "🍔",
            description: "Classic burger with melted cheese",
            ingredients: [
                { inventoryId: inventoryMap["Burger Patty"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Burger Buns"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Cheese Slice"], quantityUsed: 2 },
                { inventoryId: inventoryMap["Lettuce"], quantityUsed: 1 },
            ]
        },
        {
            name: "Double Burger", price: 14, category: "Burgers", image: "🍔",
            description: "Two patties, double the flavor",
            ingredients: [
                { inventoryId: inventoryMap["Burger Patty"], quantityUsed: 2 },
                { inventoryId: inventoryMap["Burger Buns"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Cheese Slice"], quantityUsed: 2 },
            ]
        },
        {
            name: "French Fries", price: 4, category: "Sides", image: "🍟",
            description: "Crispy golden fries",
            ingredients: [{ inventoryId: inventoryMap["French Fries"], quantityUsed: 1 }]
        },
        {
            name: "Chicken Nuggets (6pc)", price: 6, category: "Sides", image: "🍗",
            description: "Crispy chicken nuggets",
            ingredients: [{ inventoryId: inventoryMap["Chicken Nuggets"], quantityUsed: 6 }]
        },
        {
            name: "Pepperoni Pizza", price: 15, category: "Pizza", image: "🍕",
            description: "Classic pepperoni with mozzarella",
            ingredients: [
                { inventoryId: inventoryMap["Pizza Dough"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Mozzarella"], quantityUsed: 2 },
                { inventoryId: inventoryMap["Pepperoni"], quantityUsed: 1 },
            ]
        },
        {
            name: "Cheese Pizza", price: 12, category: "Pizza", image: "🍕",
            description: "Simple and delicious cheese pizza",
            ingredients: [
                { inventoryId: inventoryMap["Pizza Dough"], quantityUsed: 1 },
                { inventoryId: inventoryMap["Mozzarella"], quantityUsed: 3 },
            ]
        },
        {
            name: "Soda (Large)", price: 3, category: "Drinks", image: "🥤",
            description: "Refreshing carbonated drink",
            ingredients: [{ inventoryId: inventoryMap["Soda Syrup"], quantityUsed: 0.3 }]
        },
        {
            name: "Soda (Medium)", price: 2, category: "Drinks", image: "🥤",
            description: "Refreshing carbonated drink",
            ingredients: [{ inventoryId: inventoryMap["Soda Syrup"], quantityUsed: 0.2 }]
        },
        {
            name: "Ice Cream Sundae", price: 5, category: "Desserts", image: "🍨",
            description: "Creamy vanilla ice cream",
            ingredients: [{ inventoryId: inventoryMap["Ice Cream"], quantityUsed: 2 }]
        },
        {
            name: "Garden Salad", price: 7, category: "Healthy", image: "🥗",
            description: "Fresh mixed greens",
            ingredients: [{ inventoryId: inventoryMap["Salad Mix"], quantityUsed: 1 }]
        },
    ];

    const menuMap: Record<string, string> = {};
    for (const item of menuItems) {
        const doc = await MenuItem.findOneAndUpdate({ name: item.name }, item, { upsert: true, new: true });
        menuMap[item.name] = doc._id.toString();
    }

    // Create Meal Plans (Combos)
    const mealPlans = [
        {
            name: "Value Meal #1",
            description: "Classic Burger + Fries + Medium Drink",
            price: 12,
            originalPrice: 14,
            image: "🍔",
            category: "value",
            items: [
                { menuItemId: menuMap["Classic Burger"], quantity: 1 },
                { menuItemId: menuMap["French Fries"], quantity: 1 },
                { menuItemId: menuMap["Soda (Medium)"], quantity: 1 },
            ]
        },
        {
            name: "Cheese Lover Combo",
            description: "Cheese Burger + Fries + Large Drink",
            price: 15,
            originalPrice: 17,
            image: "🧀",
            category: "value",
            items: [
                { menuItemId: menuMap["Cheese Burger"], quantity: 1 },
                { menuItemId: menuMap["French Fries"], quantity: 1 },
                { menuItemId: menuMap["Soda (Large)"], quantity: 1 },
            ]
        },
        {
            name: "Double Stack Meal",
            description: "Double Burger + Fries + Large Drink",
            price: 18,
            originalPrice: 21,
            image: "🍔",
            category: "premium",
            items: [
                { menuItemId: menuMap["Double Burger"], quantity: 1 },
                { menuItemId: menuMap["French Fries"], quantity: 1 },
                { menuItemId: menuMap["Soda (Large)"], quantity: 1 },
            ]
        },
        {
            name: "Nuggets Box",
            description: "Nuggets (6pc) + Fries + Medium Drink",
            price: 10,
            originalPrice: 12,
            image: "🍗",
            category: "kids",
            items: [
                { menuItemId: menuMap["Chicken Nuggets (6pc)"], quantity: 1 },
                { menuItemId: menuMap["French Fries"], quantity: 1 },
                { menuItemId: menuMap["Soda (Medium)"], quantity: 1 },
            ]
        },
        {
            name: "Family Feast",
            description: "2 Cheese Burgers + 2 Nuggets + 2 Fries + 2 Large Drinks",
            price: 35,
            originalPrice: 44,
            image: "👨‍👩‍👧‍👦",
            category: "family",
            items: [
                { menuItemId: menuMap["Cheese Burger"], quantity: 2 },
                { menuItemId: menuMap["Chicken Nuggets (6pc)"], quantity: 2 },
                { menuItemId: menuMap["French Fries"], quantity: 2 },
                { menuItemId: menuMap["Soda (Large)"], quantity: 2 },
            ]
        },
        {
            name: "Pizza Party",
            description: "Pepperoni Pizza + Cheese Pizza + 4 Large Drinks",
            price: 32,
            originalPrice: 39,
            image: "🍕",
            category: "family",
            items: [
                { menuItemId: menuMap["Pepperoni Pizza"], quantity: 1 },
                { menuItemId: menuMap["Cheese Pizza"], quantity: 1 },
                { menuItemId: menuMap["Soda (Large)"], quantity: 4 },
            ]
        },
    ];

    for (const plan of mealPlans) {
        await MealPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
    }

    return NextResponse.json({
        message: "Database seeded successfully",
        stats: {
            users: users.length,
            inventory: inventoryItems.length,
            menuItems: menuItems.length,
            mealPlans: mealPlans.length
        }
    });
}
