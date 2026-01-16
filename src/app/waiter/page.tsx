"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { LazyLoad } from "@/components/ui/LazyLoad";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
}

export default function WaiterPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenu(data);
    } finally {
      setIsLoading(false);
    }
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

  const categoryIcons: Record<string, string> = {
    "Fast Food": "🍔",
    Drinks: "🥤",
    Healthy: "🥗",
    Desserts: "🍰",
    "Main Course": "🍝",
    Starters: "🥗",
  };

  const groupedMenu = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <section className="lg:col-span-2 space-y-8" aria-label="Menu items">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <SkeletonOrderCard key={i} />
                ))}
              </div>
            ) : (
              Object.entries(groupedMenu).map(([category, items], idx) => (
                <LazyLoad key={category} delay={idx * 100}>
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl" aria-hidden="true">
                        {categoryIcons[category] || "🍴"}
                      </span>
                      <h2 className="text-xl font-semibold text-[#001F3F]">
                        {category}
                      </h2>
                      <span className="text-sm text-gray-400">
                        ({items.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {items.map((item) => (
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
                          className="card card-hover card-interactive p-5 text-left group"
                          aria-label={`Add ${item.name} to cart - $${item.price}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-2xl">
                                {categoryIcons[item.category] || "🍴"}
                              </span>
                            </div>
                            <span className="btn btn-metallic text-xs py-1 px-2">
                              + Add
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800">
                            {item.name}
                          </h3>
                          <p className="text-lg font-bold text-[#001F3F] mt-1">
                            ${item.price}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </LazyLoad>
              ))
            )}
          </section>

          {/* Cart Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit" aria-label="Order cart">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">New Order</h2>
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
                <div className="relative">
                  <input
                    id="table-number"
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="input pl-12"
                    placeholder="Enter table #"
                    min="1"
                    aria-required="true"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div
                className="space-y-3 mb-6 max-h-64 overflow-y-auto"
                role="list"
                aria-label="Cart items"
              >
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
                      role="listitem"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          ×{item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">
                          ${item.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          aria-label={`Remove ${item.name} from cart`}
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
                  aria-busy={isSubmitting}
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
