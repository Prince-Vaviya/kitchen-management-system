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
        { name: "Classic Burger", price: 149, category: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", description: "Juicy beef patty with fresh veggies" },
        { name: "Cheese Burger", price: 179, category: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", description: "Classic burger with melted cheese" },
        { name: "Double Burger", price: 249, category: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", description: "Two patties, double the flavor" },
        { name: "French Fries", price: 79, category: "Sides", image: "https://images.unsplash.com/photo-1573080496987-8198cb769481?w=800&q=80", description: "Crispy golden fries" },
        { name: "Chicken Nuggets (6pc)", price: 129, category: "Sides", image: "https://images.unsplash.com/photo-1562967960-f0905791f298?w=800&q=80", description: "Crispy chicken nuggets" },
        { name: "Pepperoni Pizza", price: 349, category: "Pizza", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80", description: "Classic pepperoni with mozzarella" },
        { name: "Cheese Pizza", price: 279, category: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80", description: "Simple and delicious cheese pizza" },
        { name: "Soda (Large)", price: 59, category: "Drinks", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80", description: "Refreshing carbonated drink" },
        { name: "Soda (Medium)", price: 39, category: "Drinks", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80", description: "Refreshing carbonated drink" },
        { name: "Ice Cream Sundae", price: 99, category: "Desserts", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80", description: "Creamy vanilla ice cream" },
        { name: "Garden Salad", price: 129, category: "Healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80", description: "Fresh mixed greens" },
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
            price: 249,
            originalPrice: 249,
            image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
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
            price: 299,
            originalPrice: 299,
            image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
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
            price: 379,
            originalPrice: 379,
            image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
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
            price: 229,
            originalPrice: 229,
            image: "https://images.unsplash.com/photo-1562967960-f0905791f298?w=800&q=80",
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
            price: 699,
            originalPrice: 699,
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
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
            price: 799,
            originalPrice: 799,
            image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&q=80",
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
