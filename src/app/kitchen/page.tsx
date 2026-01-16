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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👨‍🍳</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-[#001F3F]">
                Kitchen Display
              </h1>
              <p className="text-sm text-gray-500">
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">New Orders</p>
              <p className="text-3xl font-bold text-[#001F3F]">
                {confirmedOrders.length}
              </p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Preparing</p>
              <p className="text-3xl font-bold text-[#001F3F]">
                {preparingOrders.length}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonOrderCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* New Orders Column */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                Queue
              </h2>
              {confirmedOrders.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">
                  <span className="text-5xl block mb-4">📋</span>
                  <p>Waiting for orders...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {confirmedOrders.map((order, idx) => (
                    <LazyLoad key={order._id} delay={idx * 50}>
                      <div className="card p-5 border-l-4 border-l-amber-500 animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-2xl font-bold text-white">
                                {order.type === "dine-in"
                                  ? order.tableNumber
                                  : "📦"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-lg">
                                {order.type === "dine-in"
                                  ? `Table ${order.tableNumber}`
                                  : "Pickup"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.items.length} items
                              </p>
                            </div>
                          </div>
                          <span className="badge badge-pending">New</span>
                        </div>

                        <ul className="space-y-2 mb-5">
                          {order.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                            >
                              <span className="font-medium text-gray-700">
                                {item.name}
                              </span>
                              <span className="text-xl font-bold text-amber-600">
                                ×{item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => updateStatus(order._id, "preparing")}
                          className="btn btn-primary w-full"
                        >
                          🔥 Start Preparing
                        </button>
                      </div>
                    </LazyLoad>
                  ))}
                </div>
              )}
            </section>

            {/* Preparing Column */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                In Progress
              </h2>
              {preparingOrders.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">
                  <span className="text-5xl block mb-4">👨‍🍳</span>
                  <p>Nothing cooking...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preparingOrders.map((order, idx) => (
                    <LazyLoad key={order._id} delay={idx * 50}>
                      <div className="card p-5 border-l-4 border-l-blue-500 animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md animate-pulse">
                              <span className="text-2xl font-bold text-white">
                                {order.type === "dine-in"
                                  ? order.tableNumber
                                  : "📦"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-lg">
                                {order.type === "dine-in"
                                  ? `Table ${order.tableNumber}`
                                  : "Pickup"}
                              </p>
                              <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                                <span className="animate-pulse">🔥</span>{" "}
                                Cooking...
                              </p>
                            </div>
                          </div>
                          <span className="badge badge-preparing">
                            Preparing
                          </span>
                        </div>

                        <ul className="space-y-2 mb-5">
                          {order.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                            >
                              <span className="font-medium text-gray-700">
                                {item.name}
                              </span>
                              <span className="text-xl font-bold text-blue-600">
                                ×{item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => updateStatus(order._id, "completed")}
                          className="btn btn-success w-full"
                        >
                          ✓ Ready for Pickup
                        </button>
                      </div>
                    </LazyLoad>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
