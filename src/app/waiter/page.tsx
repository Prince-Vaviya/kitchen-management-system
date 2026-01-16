"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

interface MealPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  savingsPercent: number;
  items: Array<{ menuItemId: MenuItem; quantity: number }>;
}

type ViewMode = "meals" | "items";

export default function WaiterPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("meals");
  const [tableNumber, setTableNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([fetchMenu(), fetchMealPlans()]).finally(() =>
      setIsLoading(false)
    );
  }, []);

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    setMenu(await res.json());
  };

  const fetchMealPlans = async () => {
    const res = await fetch("/api/meal-plans");
    setMealPlans(await res.json());
  };

  const handleOrder = async () => {
    if (!tableNumber) {
      showToast("Please enter a table number", "warning");
      return;
    }
    if (items.length === 0) {
      showToast("Cart is empty", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dine-in",
          tableNumber: parseInt(tableNumber),
          items,
          totalAmount: total(),
        }),
      });

      if (res.ok) {
        showToast("Order placed successfully!", "success");
        clearCart();
        setTableNumber("");
      } else {
        showToast("Failed to place order", "error");
      }
    } catch {
      showToast("Connection error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMealToCart = (meal: MealPlan) => {
    // Add each item from the meal plan to cart
    meal.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart({
          menuItemId: item.menuItemId._id,
          name: item.menuItemId.name,
          price: item.menuItemId.price,
          quantity: 1,
        });
      }
    });
    showToast(`Added ${meal.name}`, "success");
  };

  const menuCategories = [...new Set(menu.map((m) => m.category))];
  const mealCategories = [...new Set(mealPlans.map((m) => m.category))];
  const categories = viewMode === "meals" ? mealCategories : menuCategories;
  const filteredMenu = selectedCategory
    ? menu.filter((m) => m.category === selectedCategory)
    : menu;
  const filteredMeals = selectedCategory
    ? mealPlans.filter((m) => m.category === selectedCategory)
    : mealPlans;

  const categoryLabels: Record<string, string> = {
    value: "💰 Value Meals",
    family: "👨‍👩‍👧‍👦 Family",
    kids: "🧒 Kids",
    premium: "⭐ Premium",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🍽️</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-[#001F3F]">
                Waiter Station
              </h1>
              <p className="text-sm text-gray-500">Take table orders</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="btn btn-outline text-sm py-2 px-4"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <section className="lg:col-span-2">
            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setViewMode("meals");
                  setSelectedCategory(null);
                }}
                className={`btn ${
                  viewMode === "meals" ? "btn-primary" : "btn-outline"
                }`}
              >
                🍔 Meal Combos
              </button>
              <button
                onClick={() => {
                  setViewMode("items");
                  setSelectedCategory(null);
                }}
                className={`btn ${
                  viewMode === "items" ? "btn-primary" : "btn-outline"
                }`}
              >
                📋 Individual Items
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? "bg-[#001F3F] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-[#001F3F] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonOrderCard key={i} />
                ))}
              </div>
            ) : viewMode === "meals" ? (
              /* Meal Plans Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMeals.map((meal) => (
                  <div
                    key={meal._id}
                    className="card card-hover p-5 relative overflow-hidden"
                  >
                    {meal.savingsPercent > 0 && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Save {meal.savingsPercent}%
                      </div>
                    )}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center text-4xl">
                        {meal.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{meal.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {meal.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-[#001F3F]">
                          ${meal.price}
                        </span>
                        <span className="text-sm text-gray-400 line-through ml-2">
                          ${meal.originalPrice}
                        </span>
                      </div>
                      <button
                        onClick={() => addMealToCart(meal)}
                        className="btn btn-primary"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Individual Items Grid */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenu.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      addToCart({
                        menuItemId: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                      });
                      showToast(`Added ${item.name}`, "success");
                    }}
                    className="card card-hover card-interactive p-4 text-left group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">{item.image}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-lg font-bold text-[#001F3F] mt-2">
                      ${item.price}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Cart Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Order</h2>
                  <p className="text-xs text-gray-500">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Table Number */}
              <div className="mb-6">
                <label
                  htmlFor="table-number"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Table Number
                </label>
                <input
                  id="table-number"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="input"
                  placeholder="Enter table #"
                  min="1"
                />
              </div>

              {/* Cart Items */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <span className="text-4xl block mb-2">🛒</span>
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ×{item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          ${item.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Submit */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-[#001F3F]">
                    ${total()}
                  </span>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={items.length === 0 || isSubmitting}
                  className="btn btn-success w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        size="sm"
                        className="border-white/30 border-t-white"
                      />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Confirm Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
