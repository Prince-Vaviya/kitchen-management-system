# Kitchen Management System (KMS) - Documentation

## 1. System Overview

The Kitchen Management System is designed to streamline restaurant operations by connecting three key roles:

- **Waiter**: Takes dine-in orders at tables.
- **Counter**: Manages all orders (approves/rejects), handles payments/billing, and inputs pickup orders.
- **Kitchen**: View active orders, manages preparation status.

## 2. User Workflows

### 2.1 Dine-in Flow

1. **Customer Arrival**: Customer sits at a table.
2. **Order Taking (Waiter)**:
   - Waiter logs in.
   - Selects "New Order".
   - Enters **Table Number**.
   - Adds Items to cart.
   - Clicks "Confirm Order".
3. **Order Confirmation (Counter)**:
   - Counter sees incoming "Pending" order.
   - Counter checks availability/validity.
   - Counter clicks "Confirm" (Status -> `confirmed`) or "Reject" (Status -> `rejected`).
4. **Preparation (Kitchen)**:
   - If confirmed, order appears on Kitchen Display.
   - Kitchen staff marks as "Preparing" (Status -> `preparing`).
   - When done, marks as "Completed" (Status -> `completed`).
5. **Delivery & Checkout**:
   - Counter sees "Completed" status.
   - Waiter serves food.
   - Customer pays at Counter (Payment processing).

### 2.2 Pickup Flow

1. **Order Taking (Counter)**:
   - Customer approaches Counter.
   - Counter logs in.
   - Selects "New Pickup Order" (No table number).
   - Adds Items.
   - Auto-confirms or manually confirms.
2. **Preparation (Kitchen)**:
   - Order appears on Kitchen Display.
   - Kitchen process (Preparing -> Completed).
3. **Pickup**:
   - Counter sees "Completed".
   - Customer picks up order.

## 3. Technical Architecture

### 3.1 Stack

- **Fullstack Framework**: Next.js (React + API Routes).
- **Styling**: Tailwind CSS.
- **Database**: MongoDB (Local) via Mongoose.
- **Real-time**: Socket.io (integrated into Next.js server).

### 3.2 Principles

- **Route Handlers**: Backend logic residing in `app/api/` routes.
- **Component-Based**: Reusable UI components.
- **SOLID**: Applied to React components and API services.

## 4. Database Schema (Draft)

### Users

- `_id`
- `username`
- `password` (hashed)
- `role`: enum ['counter', 'waiter', 'kitchen']

### MenuItems

- `_id`
- `name`
- `price`
- `category`
- `isAvailable`: boolean

### Orders

- `_id`
- `type`: enum ['dine-in', 'pickup']
- `tableNumber`: number (optional, required if dine-in)
- `items`: [{ menuItemId, quantity, name, price }]
- `status`: enum ['pending', 'confirmed', 'preparing', 'completed', 'rejected', 'delivered']
- `totalAmount`: number
- `createdAt`: timestamp
- `updatedAt`: timestamp

## 5. API Endpoints

### Auth

- `POST /api/auth/login`

### Orders

- `POST /api/orders` (Create order)
- `GET /api/orders` (Get all - with filters for status/role)
- `PATCH /api/orders/:id/status` (Update status)

### Menu

- `GET /api/menu`
- `POST /api/menu` (Admin/Counter only - optional for MVP)
