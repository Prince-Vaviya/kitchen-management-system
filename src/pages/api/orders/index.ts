import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/types";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    await dbConnect();

    if (req.method === "POST") {
        try {
            const { items, type, tableNumber, totalAmount } = req.body;

            const order = await Order.create({
                items,
                type,
                tableNumber,
                totalAmount,
                status: type === 'dine-in' ? "pending" : "confirmed", // Pickup might auto-confirm or pending? Flow says pickup -> counter. 
                // Flow: "pickup order... counter confirms". So pending is correct. 
                // Actually flow says: "pickup order... counter gives order... counter confirms". 
                // If counter CREATES the order, it can be confirmed immediately.
                // But let's stick to pending for consistency or handle based on who created it.
            });

            // Notify counter (and kitchen if confirmed immediately)
            res.socket.server.io.emit("order_created", order);

            return res.status(201).json(order);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else if (req.method === "GET") {
        try {
            const { status, type } = req.query;
            const query: any = {};
            if (status) query.status = status;
            if (type) query.type = type;

            const orders = await Order.find(query).sort({ createdAt: -1 });
            return res.status(200).json(orders);
        } catch (error) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        res.setHeader("Allow", ["POST", "GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
