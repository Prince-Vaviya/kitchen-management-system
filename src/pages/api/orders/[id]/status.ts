import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/types";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    if (req.method !== "PATCH") {
        res.setHeader("Allow", ["PATCH"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await dbConnect();

    try {
        const { id } = req.query;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Emit event based on status
        const eventName = `order_${status}`; // order_confirmed, order_preparing, order_completed
        res.socket.server.io.emit("order_updated", order);
        res.socket.server.io.emit(eventName, order);

        return res.status(200).json(order);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
