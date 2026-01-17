"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useToast } from "@/components/ui/Toast";
import { SkeletonOrderCard } from "@/components/ui/Skeleton";
import { ProfileLayout } from "@/components/ui/ProfileLayout";
import {
  ClipboardList,
  Flame,
  ChefHat,
  Clock,
  CircleCheck,
  StickyNote,
  UtensilsCrossed,
} from "lucide-react";

interface Order {
  _id: string;
  type: string;
  tableNumber?: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const sidebarSections = [
  {
    id: "queue",
    label: "Orders in Queue",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    id: "preparing",
    label: "Orders Preparing",
    icon: <Flame className="w-5 h-5" />,
  },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState("queue");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
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
                o._id === updatedOrder._id ? updatedOrder : o,
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
        data.filter((o: Order) =>
          ["confirmed", "preparing"].includes(o.status),
        ),
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
      status === "preparing" ? "Started preparing!" : "Order ready!",
      "success",
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const queueOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const displayOrders =
    activeSection === "queue" ? queueOrders : preparingOrders;

  return (
    <ProfileLayout
      title="Kitchen Display"
      icon={<ChefHat className="w-6 h-6" />}
      sections={sidebarSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="p-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div
            onClick={() => setActiveSection("queue")}
            className={`card p-5 cursor-pointer transition-all ${
              activeSection === "queue" ? "ring-2 ring-amber-500" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Queue</p>
                <p className="text-4xl font-bold text-violet-600">
                  {queueOrders.length}
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setActiveSection("preparing")}
            className={`card p-5 cursor-pointer transition-all ${
              activeSection === "preparing" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🔥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preparing</p>
                <p className="text-4xl font-bold text-violet-600">
                  {preparingOrders.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeSection === "queue"
                ? "Orders in Queue"
                : "Orders Preparing"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {displayOrders.length} order
              {displayOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonOrderCard key={i} />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="card p-16 text-center text-gray-400">
            <span className="text-7xl block mb-4">
              {activeSection === "queue" ? "📋" : "👨‍🍳"}
            </span>
            <p className="text-xl font-medium">
              {activeSection === "queue"
                ? "No orders in queue"
                : "Nothing cooking..."}
            </p>
            <p className="text-sm mt-2">
              {activeSection === "queue"
                ? "New orders will appear here"
                : "Start preparing orders from the queue"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {displayOrders.map((order) => (
              <div
                key={order._id}
                onClick={() =>
                  setSelectedOrder(
                    selectedOrder?._id === order._id ? null : order,
                  )
                }
                className={`card p-6 cursor-pointer transition-all border-l-4 ${
                  activeSection === "queue"
                    ? "border-l-amber-500"
                    : "border-l-blue-500"
                } ${
                  selectedOrder?._id === order._id
                    ? "ring-2 ring-violet-900"
                    : "hover:shadow-lg"
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white ${
                        activeSection === "queue"
                          ? "bg-gradient-to-br from-amber-500 to-amber-600"
                          : "bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse"
                      }`}
                    >
                      {order.type === "dine-in" ? order.tableNumber : "📦"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-xl">
                        {order.type === "dine-in"
                          ? `Table ${order.tableNumber}`
                          : "Pickup"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)} • {order.items.length}{" "}
                        items
                      </p>
                      {activeSection === "preparing" && (
                        <p className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1">
                          <span className="animate-pulse">🔥</span> Cooking...
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      activeSection === "queue"
                        ? "badge-pending"
                        : "badge-preparing"
                    }`}
                  >
                    {activeSection === "queue" ? "New" : "Preparing"}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          activeSection === "queue"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expanded Price Details */}
                {selectedOrder?._id === order._id && (
                  <div className="mb-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Price Breakdown
                    </h4>
                    <div className="space-y-1 text-sm">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-gray-600"
                        >
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>${item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>${order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(
                      order._id,
                      activeSection === "queue" ? "preparing" : "completed",
                    );
                  }}
                  className={`btn w-full py-3 ${
                    activeSection === "queue" ? "btn-primary" : "btn-success"
                  }`}
                >
                  {activeSection === "queue"
                    ? "🔥 Start Preparing"
                    : "✓ Ready for Pickup"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
