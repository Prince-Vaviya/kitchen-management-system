"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCartStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { ProfileLayout } from "@/components/ui/ProfileLayout";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  ClipboardList,
  History,
  PlusCircle,
  Store,
  Sandwich,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

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
  {
    id: "active",
    label: "Order Details",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "history",
    label: "Order History",
    icon: <History className="w-5 h-5" />,
  },
  { id: "new", label: "New Order", icon: <PlusCircle className="w-5 h-5" /> },
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
      title="Counter Station"
      icon={<Store className="w-6 h-6" />}
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === "meals"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  <Sandwich className="w-4 h-4" /> Meal Combos
                </button>
                <button
                  onClick={() => {
                    setViewMode("items");
                    setActiveCategory("all");
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === "items"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> Individual Items
                </button>
              </div>

              {/* Category Cards (POS Style) */}
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                {(viewMode === "meals" ? mealCategories : itemCategories).map(
                  (cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] p-3 rounded-2xl transition-all border ${
                        activeCategory === cat.id
                          ? "bg-violet-600 text-white shadow-lg scale-105 border-violet-600"
                          : "bg-white text-gray-400 hover:bg-gray-50 hover:border-gray-200 border-transparent shadow-sm"
                      }`}
                    >
                      <DynamicIcon
                        name={cat.id === "all" ? "LayoutGrid" : cat.label}
                        className={`w-8 h-8 mb-2 ${
                          activeCategory === cat.id
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-xs font-semibold">{cat.label}</span>
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
                      NEW ORDER
                    </p>
                  </div>
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
                    <span className="font-medium text-gray-800">
                      ${total()}
                    </span>
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

                  <button
                    onClick={handleNewOrder}
                    disabled={items.length === 0 || isLoading}
                    className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? "Processing..." : "Place Order"}
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
