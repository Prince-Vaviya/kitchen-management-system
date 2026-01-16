import { create } from 'zustand';
import { IOrder } from '@/models/Order';

interface KitchenStore {
    orders: IOrder[];
    preparingOrders: IOrder[];
    completedOrders: IOrder[];
    setOrders: (orders: IOrder[]) => void;
    addOrder: (order: IOrder) => void;
    updateOrderStatus: (orderId: string, status: string) => void;
}

export const useKitchenStore = create<KitchenStore>((set) => ({
    orders: [],
    preparingOrders: [],
    completedOrders: [],
    setOrders: (orders) => set({ orders }),
    addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
    updateOrderStatus: (orderId, status) => set((state) => {
        const updatedOrders = state.orders.map((o) =>
            (o as any)._id === orderId ? { ...o, status } : o
        );
        // Logic to move between lists (optional, or just filter in UI)
        return { orders: updatedOrders as any };
    }),
}));

interface CartItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (menuItemId: string) => void;
    decreaseQuantity: (menuItemId: string) => void;
    getItemQuantity: (menuItemId: string) => number;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    addToCart: (item) => set((state) => {
        const existing = state.items.find(i => i.menuItemId === item.menuItemId);
        if (existing) {
            return {
                items: state.items.map(i =>
                    i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return { items: [...state.items, item] };
    }),
    removeFromCart: (id) => set((state) => ({
        items: state.items.filter(i => i.menuItemId !== id)
    })),
    decreaseQuantity: (id) => set((state) => {
        const existing = state.items.find(i => i.menuItemId === id);
        if (existing && existing.quantity > 1) {
            return {
                items: state.items.map(i =>
                    i.menuItemId === id ? { ...i, quantity: i.quantity - 1 } : i
                )
            };
        }
        // Remove item if quantity would become 0
        return { items: state.items.filter(i => i.menuItemId !== id) };
    }),
    getItemQuantity: (id) => {
        const item = get().items.find(i => i.menuItemId === id);
        return item ? item.quantity : 0;
    },
    clearCart: () => set({ items: [] }),
    total: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
}));
