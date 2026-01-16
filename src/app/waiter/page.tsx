"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { ProfileLayout } from "@/components/ui/ProfileLayout";

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
  { id: "meals", label: "Meal Combos", icon: "🍔" },
  { id: "items", label: "Individual Items", icon: "📋" },
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
      icon="🍽️"
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

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(activeSection === "meals"
                ? mealCategories
                : itemCategories
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-[#001F3F] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
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
                    <div key={meal._id} className="card p-5 relative">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-4xl">
                          {meal.image}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">
                            {meal.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {meal.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedMeal(meal)}
                          className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 text-sm"
                          title="View details"
                        >
                          ℹ️
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-2xl font-bold text-[#001F3F]">
                          ${meal.price}
                        </span>
                        {qty === 0 ? (
                          <button
                            onClick={() => addMealToCart(meal)}
                            className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center text-xl font-bold hover:bg-[#00336b] transition-colors"
                          >
                            +
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseQuantity(meal._id)}
                              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-gray-200 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-bold text-gray-800">
                              {qty}
                            </span>
                            <button
                              onClick={() => addMealToCart(meal)}
                              className="w-8 h-8 bg-[#001F3F] text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-[#00336b] transition-colors"
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
                    <div key={item._id} className="card p-5 relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mb-3">
                        <span className="text-3xl">{item.image}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xl font-bold text-[#001F3F]">
                          ${item.price}
                        </p>
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
                            className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center text-xl font-bold hover:bg-[#00336b] transition-colors"
                          >
                            +
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseQuantity(item._id)}
                              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-gray-200 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-bold text-gray-800">
                              {qty}
                            </span>
                            <button
                              onClick={() => {
                                addToCart({
                                  menuItemId: item._id,
                                  name: item.name,
                                  price: item.price,
                                  quantity: 1,
                                });
                              }}
                              className="w-8 h-8 bg-[#001F3F] text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-[#00336b] transition-colors"
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

          {/* Cart Sidebar */}
          <aside className="xl:sticky xl:top-8 h-fit">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Current Order</h2>
                  <p className="text-xs text-gray-500">
                    {items.length} item{items.length !== 1 ? "s" : ""} in cart
                  </p>
                </div>
              </div>

              {/* Table Number */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="input"
                  placeholder="Enter table #"
                  min="1"
                />
              </div>

              {/* Cart Items */}
              <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <span className="text-5xl block mb-3">🛒</span>
                    <p className="font-medium">Cart is empty</p>
                    <p className="text-sm mt-1">Select items to add</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
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
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
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
                  <span className="text-3xl font-bold text-[#001F3F]">
                    ${total()}
                  </span>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={items.length === 0 || isSubmitting}
                  className="btn btn-success w-full py-3"
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
                      <span>Send to Kitchen</span>
                    </>
                  )}
                </button>
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
                  <span className="text-2xl font-bold text-[#001F3F]">
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
