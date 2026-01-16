"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { ProfileLayout } from "@/components/ui/ProfileLayout";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  UtensilsCrossed,
  ClipboardList,
  Sandwich,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

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
  image: string;
  category: string;
  items: Array<{ menuItemId: MenuItem; quantity: number }>;
}

const mealCategories = [
  { id: "all", label: "All" },
  { id: "family", label: "Family" },
  { id: "kids", label: "Kids" },
  { id: "premium", label: "Premium" },
  { id: "value", label: "Value Meals" },
];

const itemCategories = [
  { id: "all", label: "All" },
  { id: "Burgers", label: "Burgers" },
  { id: "Pizza", label: "Pizza" },
  { id: "Sides", label: "Sides" },
  { id: "Drinks", label: "Drinks" },
  { id: "Desserts", label: "Desserts" },
  { id: "Healthy", label: "Healthy" },
];

const sidebarSections = [
  { id: "meals", label: "Meal Combos", icon: <Sandwich className="w-5 h-5" /> },
  {
    id: "items",
    label: "Individual Items",
    icon: <ClipboardList className="w-5 h-5" />,
  },
];

export default function WaiterPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeSection, setActiveSection] = useState("meals");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    items,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    getItemQuantity,
    total,
    clearCart,
  } = useCartStore();
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
    // Add the combo as a single item with combo price
    addToCart({
      menuItemId: meal._id,
      name: meal.name,
      price: meal.price,
      quantity: 1,
    });
    showToast(`Added ${meal.name}`, "success");
  };

  const filteredMeals =
    activeCategory === "all"
      ? mealPlans
      : mealPlans.filter((m) => m.category === activeCategory);

  const filteredMenu =
    activeCategory === "all"
      ? menu
      : menu.filter((m) => m.category === activeCategory);

  return (
    <ProfileLayout
      title="Waiter Station"
      icon={<UtensilsCrossed className="w-6 h-6" />}
      sections={sidebarSections}
      activeSection={activeSection}
      onSectionChange={(id) => {
        setActiveSection(id);
        setActiveCategory("all");
      }}
    >
      <div className="p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Menu Grid */}
          <section className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeSection === "meals"
                    ? "Meal Combos"
                    : "Individual Items"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {activeSection === "meals"
                    ? `${filteredMeals.length} combos available`
                    : `${filteredMenu.length} items available`}
                </p>
              </div>
            </div>

            {/* Category Cards (POS Style) */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
              {(activeSection === "meals"
                ? mealCategories
                : itemCategories
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] p-3 rounded-2xl transition-all border ${
                    activeCategory === cat.id
                      ? "bg-violet-600 text-white shadow-lg scale-105 border-violet-600"
                      : "bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300 border-transparent shadow-sm"
                  }`}
                >
                  <DynamicIcon
                    name={cat.id === "all" ? "LayoutGrid" : cat.label}
                    className={`w-8 h-8 mb-2 ${
                      activeCategory === cat.id ? "text-white" : "text-gray-400"
                    }`}
                  />
                  <span className="text-xs font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonOrderCard key={i} />
                ))}
              </div>
            ) : activeSection === "meals" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredMeals.map((meal) => {
                  const qty = getItemQuantity(meal._id);
                  return (
                    <div
                      key={meal._id}
                      className="card p-4 flex flex-col items-center text-center bg-white shadow-sm hover:shadow-md transition-shadow rounded-3xl"
                    >
                      <div
                        className={`w-full aspect-[4/3] rounded-2xl mb-4 flex items-center justify-center relative group overflow-hidden ${
                          meal.image.startsWith("http")
                            ? "bg-transparent shadow-sm"
                            : "bg-gradient-to-br from-amber-50 to-orange-50"
                        }`}
                      >
                        <DynamicIcon
                          name={meal.image}
                          className={`${
                            meal.image.startsWith("http")
                              ? "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              : "w-16 h-16 text-amber-600 transition-transform group-hover:scale-110"
                          }`}
                        />
                      </div>

                      <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">
                        {meal.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                        {meal.description}
                      </p>

                      <div className="w-full mt-auto">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-xl font-bold text-violet-900">
                            ${meal.price}
                          </span>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => addMealToCart(meal)}
                            className="w-full py-4 bg-gray-50 text-violet-600 rounded-xl font-bold hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-2 text-lg shadow-sm"
                          >
                            Add to Order
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-violet-600 text-white rounded-xl p-1 shadow-lg shadow-violet-200">
                            <button
                              onClick={() => decreaseQuantity(meal._id)}
                              className="w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-2xl font-bold"
                            >
                              −
                            </button>
                            <span className="font-bold text-xl">{qty}</span>
                            <button
                              onClick={() => addMealToCart(meal)}
                              className="w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-2xl font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenu.map((item) => {
                  const qty = getItemQuantity(item._id);
                  return (
                    <div
                      key={item._id}
                      className="card p-4 flex flex-col items-center text-center bg-white shadow-sm hover:shadow-md transition-shadow rounded-3xl"
                    >
                      <div
                        className={`w-full aspect-[4/3] rounded-2xl mb-4 flex items-center justify-center relative group overflow-hidden ${
                          item.image.startsWith("http")
                            ? "bg-transparent shadow-sm"
                            : "bg-gradient-to-br from-gray-50 to-gray-100"
                        }`}
                      >
                        <DynamicIcon
                          name={item.image}
                          className={`${
                            item.image.startsWith("http")
                              ? "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              : "w-14 h-14 text-indigo-400 transition-transform group-hover:scale-110"
                          }`}
                        />
                      </div>

                      <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2 min-h-[32px]">
                        {item.description}
                      </p>

                      <div className="w-full mt-auto">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-lg font-bold text-violet-900">
                            ${item.price}
                          </span>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => {
                              addToCart({
                                menuItemId: item._id,
                                name: item.name,
                                price: item.price,
                                quantity: 1,
                              });
                              showToast(`Added ${item.name}`, "success");
                            }}
                            className="w-full py-4 bg-gray-50 text-violet-600 rounded-xl font-bold hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-2 text-lg shadow-sm"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-violet-600 text-white rounded-xl p-1 shadow-lg shadow-violet-200">
                            <button
                              onClick={() => decreaseQuantity(item._id)}
                              className="w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-2xl font-bold"
                            >
                              −
                            </button>
                            <span className="font-bold text-xl">{qty}</span>
                            <button
                              onClick={() => {
                                addToCart({
                                  menuItemId: item._id,
                                  name: item.name,
                                  price: item.price,
                                  quantity: 1,
                                });
                              }}
                              className="w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-2xl font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Cart Sidebar (Receipt Style) */}
          <aside className="xl:sticky xl:top-8 h-fit">
            <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col h-[calc(100vh-140px)]">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-dashed border-gray-100">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">
                    Current Order
                  </h2>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">
                    ORDER #
                    {Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}
                  </p>
                </div>
              </div>

              {/* Table Number */}
              <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Table Number
                </label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-white border-none rounded-xl py-3 px-4 font-bold text-gray-800 text-lg focus:ring-2 focus:ring-violet-500/20 outline-none"
                  placeholder="0"
                  min="1"
                />
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium text-sm">No items yet</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.menuItemId} className="flex gap-3 group">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                        {/* Placeholder or small icon if possible, else generic */}
                        <div className="font-bold text-gray-400 text-xs">
                          x{item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">
                            {item.name}
                          </h4>
                          <span className="font-bold text-violet-600 text-sm">
                            ${item.price * item.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          ${item.price} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Summary & Actions */}
              <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">${total()}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-sm">
                  <span className="text-gray-500">Tax (5%)</span>
                  <span className="font-medium text-gray-800">
                    ${(total() * 0.05).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-400 text-sm font-medium">
                    Total Amount
                  </span>
                  <span className="text-3xl font-extrabold text-violet-900">
                    ${(total() * 1.05).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={clearCart}
                    className="py-4 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOrder}
                    disabled={items.length === 0 || isSubmitting}
                    className="py-4 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <Spinner className="w-5 h-5 text-white" />
                    ) : (
                      "Place Order"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMeal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-5xl">
                  {selectedMeal.image}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedMeal.name}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {selectedMeal.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Items Included */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                Items Included
              </h3>
              <div className="space-y-3">
                {selectedMeal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.menuItemId.image}</span>
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.menuItemId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-700">
                      ${item.menuItemId.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Price */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    Combo Price
                  </span>
                  <span className="text-2xl font-bold text-violet-900">
                    ${selectedMeal.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Add to Order Button */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  addMealToCart(selectedMeal);
                  setSelectedMeal(null);
                }}
                className="btn btn-primary w-full py-3"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
