"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { LazyLoad } from "@/components/ui/LazyLoad";

interface Order {
  _id: string;
  type: string;
  tableNumber?: number;
  items: Array<{ name: string; quantity: number }>;
  status: string;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on("order_created", (newOrder: Order) => {
        if (newOrder.status !== "pending") {
          setOrders((prev) => [newOrder, ...prev]);
          showToast("New order!", "info");
        }
      });
      socket.on("order_updated", (updatedOrder: Order) => {
        if (
          ["confirmed", "preparing", "completed"].includes(updatedOrder.status)
        ) {
          setOrders((prev) => {
            const exists = prev.find((o) => o._id === updatedOrder._id);
            if (exists) {
              return prev.map((o) =>
                o._id === updatedOrder._id ? updatedOrder : o
              );
            }
            return [updatedOrder, ...prev];
          });
        } else {
          setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
        }
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
      setOrders(
        data.filter((o: Order) => ["confirmed", "preparing"].includes(o.status))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(
      `Order ${status === "preparing" ? "started" : "ready"}!`,
      "success"
    );
  };

  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");

  return (
    <div className="min-h-screen bg-[#001530]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#001F3F]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] rounded-xl flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 0 20px rgba(192,192,192,0.3)" }}
            >
              <span className="text-2xl">👨‍🍳</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">Kitchen Display</h1>
              <p className="text-sm text-gray-400">
                {confirmedOrders.length + preparingOrders.length} active order
                {confirmedOrders.length + preparingOrders.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 text-sm ${
                isConnected ? "text-green-400" : "text-gray-500"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-gray-500"
                }`}
              />
              {isConnected ? "Live" : "Offline"}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Queue Labels */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"
              style={{ boxShadow: "0 0 10px rgba(59,130,246,0.5)" }}
            />
            <span className="text-lg font-semibold text-white">
              New Orders ({confirmedOrders.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full bg-[#C0C0C0] animate-pulse"
              style={{ boxShadow: "0 0 10px rgba(192,192,192,0.5)" }}
            />
            <span className="text-lg font-semibold text-white">
              Preparing ({preparingOrders.length})
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <SkeletonOrderCard />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Confirmed Column */}
            <div className="space-y-4">
              {confirmedOrders.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
                  <span className="text-5xl block mb-4 opacity-40">📋</span>
                  <p className="text-gray-500">Waiting for orders...</p>
                </div>
              )}
              {confirmedOrders.map((order, idx) => (
                <LazyLoad key={order._id} delay={idx * 50}>
                  <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{ boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}
                        >
                          <span className="text-3xl font-bold text-white">
                            {order.type === "dine-in"
                              ? order.tableNumber
                              : "📦"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {order.type === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Pickup"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-confirmed">New</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {order.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center p-3 bg-white/5 rounded-xl"
                        >
                          <span className="text-white font-medium">
                            {item.name}
                          </span>
                          <span className="text-2xl font-bold text-blue-400">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => updateStatus(order._id, "preparing")}
                      className="w-full py-4 bg-gradient-to-r from-[#C0C0C0] to-[#A0A0A0] text-[#001F3F] font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ boxShadow: "0 4px 20px rgba(192,192,192,0.3)" }}
                    >
                      🔥 Start Preparing
                    </button>
                  </div>
                </LazyLoad>
              ))}
            </div>

            {/* Preparing Column */}
            <div className="space-y-4">
              {preparingOrders.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
                  <span className="text-5xl block mb-4 opacity-40">👨‍🍳</span>
                  <p className="text-gray-500">Nothing cooking...</p>
                </div>
              )}
              {preparingOrders.map((order, idx) => (
                <LazyLoad key={order._id} delay={idx * 50}>
                  <div
                    className="bg-gradient-to-br from-[#C0C0C0]/10 to-transparent rounded-2xl p-6 border-2 border-[#C0C0C0]/30 animate-fade-in"
                    style={{ boxShadow: "0 0 30px rgba(192,192,192,0.1)" }}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
                          style={{
                            boxShadow: "0 0 20px rgba(192,192,192,0.5)",
                          }}
                        >
                          <span className="text-3xl font-bold text-[#001F3F]">
                            {order.type === "dine-in"
                              ? order.tableNumber
                              : "📦"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {order.type === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Pickup"}
                          </p>
                          <p className="text-[#C0C0C0] text-sm font-medium">
                            🔥 Cooking...
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-preparing">Preparing</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {order.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center p-3 bg-white/5 rounded-xl"
                        >
                          <span className="text-white font-medium">
                            {item.name}
                          </span>
                          <span className="text-2xl font-bold text-[#C0C0C0]">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => updateStatus(order._id, "completed")}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.3)" }}
                    >
                      ✓ Mark Ready
                    </button>
                  </div>
                </LazyLoad>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
