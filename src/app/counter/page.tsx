"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCartStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";

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
}

interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  stockStatus: "ok" | "low" | "out";
}

interface StockIssue {
  item: string;
  ingredient: string;
  available: number;
  needed: number;
}

type ActiveTab = "orders" | "inventory" | "pickup";

export default function CounterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockCheck, setStockCheck] = useState<Record<string, StockIssue[]>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");
  const [isLoading, setIsLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore();
  const [menu, setMenu] = useState<
    Array<{ _id: string; name: string; price: number; image: string }>
  >([]);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchInventory(), fetchMenu()]).finally(() =>
      setIsLoading(false)
    );

    if (socket) {
      socket.on("order_created", (newOrder: Order) => {
        setOrders((prev) => [newOrder, ...prev]);
        checkOrderStock(newOrder);
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
    const data = await res.json();
    setOrders(data);
    // Check stock for pending orders
    data.filter((o: Order) => o.status === "pending").forEach(checkOrderStock);
  };

  const fetchInventory = async () => {
    const res = await fetch("/api/inventory");
    setInventory(await res.json());
  };

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    setMenu(await res.json());
  };

  const checkOrderStock = async (order: Order) => {
    try {
      const res = await fetch("/api/inventory/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: order.items }),
      });
      const data = await res.json();
      if (!data.canFulfill) {
        setStockCheck((prev) => ({ ...prev, [order._id]: data.issues }));
      }
    } catch (e) {
      console.error("Stock check failed", e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(`Order ${status}`, status === "rejected" ? "warning" : "success");
    // Remove stock check after handling
    setStockCheck((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const updateInventoryStock = async (id: string, newQuantity: number) => {
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQuantity }),
    });
    setInventory((prev) =>
      prev.map((i) =>
        i._id === id
          ? {
              ...i,
              quantity: newQuantity,
              stockStatus: getStockStatus(newQuantity, i.lowStockThreshold),
            }
          : i
      )
    );
    setEditingStock(null);
    showToast("Stock updated", "success");
  };

  const getStockStatus = (
    qty: number,
    threshold: number
  ): "ok" | "low" | "out" => {
    if (qty <= 0) return "out";
    if (qty <= threshold) return "low";
    return "ok";
  };

  const handlePickupOrder = async () => {
    if (items.length === 0) return;

    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pickup", items, totalAmount: total() }),
    });
    clearCart();
    showToast("Pickup order created!", "success");
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) =>
    ["confirmed", "preparing", "completed"].includes(o.status)
  );

  const statusBadge: Record<string, string> = {
    pending: "badge-pending",
    confirmed: "badge-confirmed",
    preparing: "badge-preparing",
    completed: "badge-completed",
  };

  const stockStatusColor: Record<string, string> = {
    ok: "bg-green-100 text-green-800",
    low: "bg-amber-100 text-amber-800",
    out: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-[#001F3F]">Counter</h1>
              <p className="text-sm text-gray-500">
                Order & Inventory Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 text-sm ${
                isConnected ? "text-green-600" : "text-gray-400"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              {isConnected ? "Live" : "Offline"}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="btn btn-outline text-sm py-2 px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {[
              { id: "orders", label: "📋 Orders", badge: pendingOrders.length },
              { id: "inventory", label: "📦 Inventory" },
              { id: "pickup", label: "🛍️ New Pickup" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-[#001F3F] text-[#001F3F]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Orders */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                ⏳ Pending Approval
                <span className="badge badge-pending">
                  {pendingOrders.length}
                </span>
              </h2>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <SkeletonOrderCard key={i} />
                  ))}
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="card p-8 text-center text-gray-400">
                  <span className="text-5xl block mb-3">✅</span>
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div
                      key={order._id}
                      className={`card p-5 border-l-4 ${
                        stockCheck[order._id]
                          ? "border-l-red-400"
                          : "border-l-amber-400"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">
                              {order.type === "dine-in" ? "🍽️" : "📦"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {order.type === "dine-in"
                                ? `Table ${order.tableNumber}`
                                : "Pickup"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.items.length} items • ${order.totalAmount}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${statusBadge[order.status]}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Stock Warning */}
                      {stockCheck[order._id] && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                            ⚠️ Stock Issues
                          </p>
                          <ul className="mt-1 text-xs text-red-700 space-y-1">
                            {stockCheck[order._id].map((issue, i) => (
                              <li key={i}>
                                • {issue.ingredient}: need {issue.needed}, have{" "}
                                {issue.available}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <ul className="mb-4 space-y-1">
                        {order.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between text-sm text-gray-600"
                          >
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span>${item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-3">
                        <button
                          onClick={() => updateStatus(order._id, "confirmed")}
                          className="btn btn-success flex-1"
                        >
                          ✓ Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(order._id, "rejected")}
                          className="btn btn-danger flex-1"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Active Orders */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Active Orders
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order._id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-gray-800">
                        {order.type === "dine-in"
                          ? `Table ${order.tableNumber}`
                          : "Pickup"}{" "}
                        • ${order.totalAmount}
                      </p>
                      <span className={`badge ${statusBadge[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          • {item.quantity}× {item.name}
                        </li>
                      ))}
                    </ul>
                    {order.status === "completed" && (
                      <button
                        onClick={() => updateStatus(order._id, "delivered")}
                        className="btn btn-primary w-full mt-4"
                      >
                        💰 Mark Delivered
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                📦 Inventory Management
              </h2>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">
                  {inventory.filter((i) => i.stockStatus === "low").length} low
                  stock
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {inventory.filter((i) => i.stockStatus === "out").length} out
                  of stock
                </span>
              </div>
            </div>

            {/* Low Stock Alert */}
            {inventory.filter((i) => i.stockStatus !== "ok").length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-semibold text-amber-800 mb-2">
                  ⚠️ Items needing restock:
                </p>
                <div className="flex flex-wrap gap-2">
                  {inventory
                    .filter((i) => i.stockStatus !== "ok")
                    .map((item) => (
                      <span
                        key={item._id}
                        className={`text-xs px-2 py-1 rounded-full ${
                          stockStatusColor[item.stockStatus]
                        }`}
                      >
                        {item.name}: {item.quantity} {item.unit}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item) => (
                <div
                  key={item._id}
                  className={`card p-4 ${
                    item.stockStatus === "out"
                      ? "border-red-200 bg-red-50/50"
                      : item.stockStatus === "low"
                      ? "border-amber-200 bg-amber-50/50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stockStatusColor[item.stockStatus]
                      }`}
                    >
                      {item.stockStatus === "ok"
                        ? "✓ OK"
                        : item.stockStatus === "low"
                        ? "⚠ Low"
                        : "✕ Out"}
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-[#001F3F] mb-3">
                    {item.quantity}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      {item.unit}
                    </span>
                  </p>

                  {editingStock === item._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={stockValue}
                        onChange={(e) => setStockValue(Number(e.target.value))}
                        className="input flex-1"
                        min="0"
                      />
                      <button
                        onClick={() =>
                          updateInventoryStock(item._id, stockValue)
                        }
                        className="btn btn-success py-2 px-3"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingStock(null)}
                        className="btn btn-outline py-2 px-3"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Quick Restock Buttons */}
                      <div className="flex gap-2">
                        {[10, 25, 50].map((amount) => (
                          <button
                            key={amount}
                            onClick={() =>
                              updateInventoryStock(
                                item._id,
                                item.quantity + amount
                              )
                            }
                            className="flex-1 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setEditingStock(item._id);
                          setStockValue(item.quantity);
                        }}
                        className="btn btn-metallic w-full text-sm py-2"
                      >
                        Set Custom Amount
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-3">
                    Alert threshold: {item.lowStockThreshold} {item.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pickup Tab */}
        {activeTab === "pickup" && (
          <div className="max-w-2xl mx-auto">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🛍️ New Pickup Order
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto">
                {menu.map((item) => (
                  <button
                    key={item._id}
                    onClick={() =>
                      addToCart({
                        menuItemId: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                      })
                    }
                    className="card card-interactive p-3 text-left"
                  >
                    <span className="text-2xl mb-1 block">{item.image}</span>
                    <p className="font-medium text-sm text-gray-800">
                      {item.name}
                    </p>
                    <p className="text-[#001F3F] font-bold">${item.price}</p>
                  </button>
                ))}
              </div>

              {items.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="space-y-2 mb-4">
                    {items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex justify-between items-center p-2 bg-blue-50 rounded-lg"
                      >
                        <span className="text-sm">
                          {item.quantity}× {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            ${item.price * item.quantity}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.menuItemId)}
                            className="text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-[#001F3F]">
                      ${total()}
                    </span>
                  </div>
                  <button
                    onClick={handlePickupOrder}
                    className="btn btn-primary w-full"
                  >
                    Create Pickup Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
