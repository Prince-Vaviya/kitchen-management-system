"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCartStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { ProfileLayout } from "@/components/ui/ProfileLayout";

interface Order {
  _id: string;
  type: string;
  tableNumber?: number;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  totalAmount: number;
  createdAt: string;
}

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

const sidebarSections = [
  { id: "active", label: "Order Details", icon: "📋" },
  { id: "history", label: "Order History", icon: "📜" },
  { id: "new", label: "New Order", icon: "➕" },
];

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

export default function CounterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeSection, setActiveSection] = useState("active");
  const [viewMode, setViewMode] = useState<"meals" | "items">("meals");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { showToast } = useToast();
  const {
    items,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    getItemQuantity,
    total,
    clearCart,
  } = useCartStore();

  useEffect(() => {
    Promise.all([fetchOrders(), fetchMenu(), fetchMealPlans()]).finally(() =>
      setIsLoading(false)
    );

    if (socket) {
      socket.on("order_created", (newOrder: Order) => {
        setOrders((prev) => [newOrder, ...prev]);
        showToast("New order received!", "info");
      });
      socket.on("order_updated", (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("order_created");
        socket.off("order_updated");
      }
    };
  }, [socket]);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
  };

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    setMenu(await res.json());
  };

  const fetchMealPlans = async () => {
    const res = await fetch("/api/meal-plans");
    setMealPlans(await res.json());
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(`Order ${status}`, status === "rejected" ? "warning" : "success");
  };

  const handleNewOrder = async () => {
    if (items.length === 0) return;

    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pickup", items, totalAmount: total() }),
    });
    clearCart();
    showToast("Order created!", "success");
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

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "completed"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["delivered", "rejected"].includes(o.status)
  );

  const statusBadge: Record<string, string> = {
    pending: "badge-pending",
    confirmed: "badge-confirmed",
    preparing: "badge-preparing",
    completed: "badge-completed",
    delivered: "bg-gray-100 text-gray-600",
    rejected: "bg-red-100 text-red-600",
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProfileLayout
      title="Counter"
      icon="💳"
      sections={sidebarSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="p-8">
        {/* Active Orders Section */}
        {activeSection === "active" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Details
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {activeOrders.length} active order
                  {activeOrders.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <SkeletonOrderCard key={i} />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <span className="text-6xl block mb-4">📋</span>
                <p className="text-lg font-medium">No active orders</p>
                <p className="text-sm mt-1">
                  Orders will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder?._id === order._id ? null : order
                      )
                    }
                    className={`card p-5 cursor-pointer transition-all ${
                      selectedOrder?._id === order._id
                        ? "ring-2 ring-[#001F3F]"
                        : "hover:shadow-md"
                    }`}
                  >
                    {/* Order Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                            order.status === "pending"
                              ? "bg-amber-100"
                              : order.status === "preparing"
                              ? "bg-blue-100"
                              : order.status === "completed"
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {order.type === "dine-in" ? "🍽️" : "📦"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {order.type === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Pickup Order"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)} • {order.items.length}{" "}
                            items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-[#001F3F]">
                          ${order.totalAmount}
                        </span>
                        <span className={`badge ${statusBadge[order.status]}`}>
                          {order.status}
                        </span>
                        <span className="text-gray-400">
                          {selectedOrder?._id === order._id ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedOrder?._id === order._id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                        <h4 className="font-semibold text-gray-700 mb-3">
                          Order Items
                        </h4>
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                            >
                              <span className="text-gray-800">
                                {item.quantity}× {item.name}
                              </span>
                              <span className="font-semibold text-gray-700">
                                ${item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        {order.status === "pending" && (
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order._id, "confirmed");
                              }}
                              className="btn btn-success flex-1"
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order._id, "rejected");
                              }}
                              className="btn btn-danger flex-1"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        {order.status === "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(order._id, "delivered");
                            }}
                            className="btn btn-primary w-full"
                          >
                            💰 Mark Delivered
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order History Section */}
        {activeSection === "history" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Order History
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {completedOrders.length} completed order
                {completedOrders.length !== 1 ? "s" : ""}
              </p>
            </div>

            {completedOrders.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <span className="text-6xl block mb-4">📜</span>
                <p className="text-lg font-medium">No order history</p>
                <p className="text-sm mt-1">
                  Completed orders will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder?._id === order._id ? null : order
                      )
                    }
                    className="card p-5 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                          {order.type === "dine-in" ? "🍽️" : "📦"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {order.type === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Pickup Order"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gray-600">
                          ${order.totalAmount}
                        </span>
                        <span className={`badge ${statusBadge[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {selectedOrder?._id === order._id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                            >
                              <span>
                                {item.quantity}× {item.name}
                              </span>
                              <span className="font-semibold">
                                ${item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Order Section */}
        {activeSection === "new" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Menu Grid */}
            <section className="xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {viewMode === "meals" ? "Meal Combos" : "Individual Items"}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {viewMode === "meals"
                      ? `${filteredMeals.length} combos available`
                      : `${filteredMenu.length} items available`}
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setViewMode("meals");
                    setActiveCategory("all");
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "meals"
                      ? "bg-[#001F3F] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🍔 Meal Combos
                </button>
                <button
                  onClick={() => {
                    setViewMode("items");
                    setActiveCategory("all");
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "items"
                      ? "bg-[#001F3F] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📋 Individual Items
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(viewMode === "meals" ? mealCategories : itemCategories).map(
                  (cat) => (
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
                  )
                )}
              </div>

              {/* Meal Combos Grid */}
              {viewMode === "meals" ? (
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

            {/* Cart */}
            <aside className="xl:sticky xl:top-8 h-fit">
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">Order Cart</h3>

                <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <span className="text-4xl block mb-2">🛒</span>
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            ×{item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            ${item.price * item.quantity}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.menuItemId)}
                            className="text-red-500 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <span>Total</span>
                    <span className="text-2xl font-bold text-[#001F3F]">
                      ${total()}
                    </span>
                  </div>
                  <button
                    onClick={handleNewOrder}
                    disabled={items.length === 0}
                    className="btn btn-success w-full"
                  >
                    Create Order
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
