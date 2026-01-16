"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCartStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { LazyLoad } from "@/components/ui/LazyLoad";

interface Order {
  _id: string;
  type: string;
  tableNumber?: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function CounterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore();
  const [menu, setMenu] = useState<
    Array<{ _id: string; name: string; price: number }>
  >([]);

  useEffect(() => {
    fetchOrders();
    fetchMenu();

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
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    setMenu(await res.json());
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(`Order ${status}`, status === "rejected" ? "warning" : "success");
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
    rejected: "badge-rejected",
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
              <p className="text-sm text-gray-500">Order Management</p>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders Section */}
          <section className="lg:col-span-2 space-y-8">
            {/* Pending */}
            <LazyLoad>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⏳</span>
                  <h2 className="text-xl font-semibold text-[#001F3F]">
                    Pending Approval
                  </h2>
                  <span className="badge badge-pending">
                    {pendingOrders.length}
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <SkeletonOrderCard key={i} />
                    ))}
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="card p-8 text-center text-gray-400">
                    <span className="text-5xl block mb-3">✅</span>
                    <p className="font-medium">No pending orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <div
                        key={order._id}
                        className="card p-5 border-l-4 border-l-amber-400 animate-fade-in"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
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
                                {order.items.length} items • $
                                {order.totalAmount}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`badge ${statusBadge[order.status]}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <ul className="mb-4 space-y-1.5">
                          {order.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between text-sm text-gray-600"
                            >
                              <span>
                                {item.quantity}× {item.name}
                              </span>
                              <span className="text-gray-400">
                                ${item.price * item.quantity}
                              </span>
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
              </div>
            </LazyLoad>

            {/* Active */}
            <LazyLoad delay={200}>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-xl font-semibold text-[#001F3F]">
                    Active Orders
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {activeOrders.map((order) => (
                    <div key={order._id} className="card p-5 animate-fade-in">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {order.type === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Pickup"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${order.totalAmount}
                          </p>
                        </div>
                        <span className={`badge ${statusBadge[order.status]}`}>
                          {order.status}
                        </span>
                      </div>

                      <ul className="mb-3 text-sm text-gray-600 space-y-1">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            • {item.quantity}× {item.name}
                          </li>
                        ))}
                      </ul>

                      {order.status === "completed" && (
                        <button
                          onClick={() => updateStatus(order._id, "delivered")}
                          className="btn btn-primary w-full"
                        >
                          💰 Mark Delivered
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </LazyLoad>
          </section>

          {/* Pickup Form */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    New Pickup Order
                  </h2>
                  <p className="text-xs text-gray-500">Walk-in customer</p>
                </div>
              </div>

              <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
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
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                  >
                    <span className="font-medium text-gray-700">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">${item.price}</span>
                      <span className="w-6 h-6 bg-[#001F3F] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        +
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between items-center p-2 bg-blue-50 border border-blue-100 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {item.quantity}× {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#001F3F]">
                        ${item.price * item.quantity}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-[#001F3F]">
                    ${total()}
                  </span>
                </div>
                <button
                  onClick={handlePickupOrder}
                  disabled={items.length === 0}
                  className="btn btn-primary w-full"
                >
                  Create Pickup Order
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
