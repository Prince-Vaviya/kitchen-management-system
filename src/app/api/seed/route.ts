import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import MenuItem from "@/models/MenuItem";
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

    // Create Menu Items
    const menuItems = [
        { name: "Classic Burger", price: 8, category: "Burgers", image: "🍔", description: "Juicy beef patty with fresh veggies" },
        { name: "Cheese Burger", price: 10, category: "Burgers", image: "🍔", description: "Classic burger with melted cheese" },
        { name: "Double Burger", price: 14, category: "Burgers", image: "🍔", description: "Two patties, double the flavor" },
        { name: "French Fries", price: 4, category: "Sides", image: "🍟", description: "Crispy golden fries" },
        { name: "Chicken Nuggets (6pc)", price: 6, category: "Sides", image: "🍗", description: "Crispy chicken nuggets" },
        { name: "Pepperoni Pizza", price: 15, category: "Pizza", image: "🍕", description: "Classic pepperoni with mozzarella" },
        { name: "Cheese Pizza", price: 12, category: "Pizza", image: "🍕", description: "Simple and delicious cheese pizza" },
        { name: "Soda (Large)", price: 3, category: "Drinks", image: "🥤", description: "Refreshing carbonated drink" },
        { name: "Soda (Medium)", price: 2, category: "Drinks", image: "🥤", description: "Refreshing carbonated drink" },
        { name: "Ice Cream Sundae", price: 5, category: "Desserts", image: "🍨", description: "Creamy vanilla ice cream" },
        { name: "Garden Salad", price: 7, category: "Healthy", image: "🥗", description: "Fresh mixed greens" },
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
            originalPrice: 12,
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
            originalPrice: 15,
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
            originalPrice: 18,
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
            originalPrice: 10,
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
            price: 38,
            originalPrice: 38,
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
            price: 35,
            originalPrice: 35,
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
            menuItems: menuItems.length,
            mealPlans: mealPlans.length
        }
    });
}
