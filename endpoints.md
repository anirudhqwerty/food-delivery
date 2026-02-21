# Food Delivery API Endpoints

## Auth Service Endpoints

| Endpoint | What It Does | Function/File | Executed In |
|----------|--------------|---------------|-------------|
| `POST /auth/register` | Register new user (customer/vendor/delivery) | `router.post("/register")` in auth.routes.js | [backend/services/auth-service/routes/auth.routes.js](backend/services/auth-service/routes/auth.routes.js) |
| `POST /auth/login` | Authenticate user, return JWT token | `router.post("/login")` in auth.routes.js | [backend/services/auth-service/routes/auth.routes.js](backend/services/auth-service/routes/auth.routes.js) |
| `GET /auth/me` | Get current authenticated user profile | `router.get("/me")` in auth.routes.js | [backend/services/auth-service/routes/auth.routes.js](backend/services/auth-service/routes/auth.routes.js) |

---

## Vendor Service Endpoints

| Endpoint | What It Does | Function/File | Executed In |
|----------|--------------|---------------|-------------|
| `GET /vendor/restaurant` | Get vendor's restaurant or create default | `router.get("/restaurant")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `POST /vendor/restaurant` | Create new restaurant for vendor | `router.post("/restaurant")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `PUT /vendor/restaurant` | Update vendor's restaurant details | `router.put("/restaurant")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `GET /vendor/menu` | Get all menu items for vendor's restaurant | `router.get("/menu")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `POST /vendor/menu` | Add new menu item to vendor's restaurant | `router.post("/menu")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `PUT /vendor/menu/:id` | Update menu item (price, quantity, availability) | `router.put("/menu/:id")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `DELETE /vendor/menu/:id` | Delete menu item from vendor's restaurant | `router.delete("/menu/:id")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `GET /vendor/public/restaurants` | Get all restaurants for customer feed | `router.get("/public/restaurants")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `GET /vendor/public/menu` | Get available menu items from all restaurants | `router.get("/public/menu")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |
| `GET /vendor/public/menu/:id` | Get single available menu item by ID | `router.get("/public/menu/:id")` in restaurant.routes.js | [backend/services/vendor-service/routes/restaurant.routes.js](backend/services/vendor-service/routes/restaurant.routes.js) |

---

## Order Service Endpoints

| Endpoint | What It Does | Function/File | Executed In |
|----------|--------------|---------------|-------------|
| `POST /order` | Create new order with items | `createOrder()` in order.controller.js | [backend/services/order-service/src/order.controller.js](backend/services/order-service/src/order.controller.js) & [backend/services/order-service/routes/restaurant.routes.js](backend/services/order-service/routes/restaurant.routes.js) |
| `GET /order/:orderId` | Get specific order details by ID | `getOrder()` in order.controller.js | [backend/services/order-service/src/order.controller.js](backend/services/order-service/src/order.controller.js) & [backend/services/order-service/routes/restaurant.routes.js](backend/services/order-service/routes/restaurant.routes.js) |
| `GET /order/restaurant/:restaurantId` | Get all orders for a specific restaurant | `getRestaurantOrders()` in order.controller.js | [backend/services/order-service/src/order.controller.js](backend/services/order-service/src/order.controller.js) & [backend/services/order-service/routes/restaurant.routes.js](backend/services/order-service/routes/restaurant.routes.js) |
| `PATCH /order/:orderId/status` | Update order status, publish RabbitMQ event | `updateOrderStatus()` in order.controller.js | [backend/services/order-service/src/order.controller.js](backend/services/order-service/src/order.controller.js) & [backend/services/order-service/routes/restaurant.routes.js](backend/services/order-service/routes/restaurant.routes.js) |

---

## Delivery Service Endpoints

| Endpoint | What It Does | Function/File | Executed In |
|----------|--------------|---------------|-------------|
| `GET /delivery/available` | Get available delivery tasks | `getAvailableDeliveries()` in delivery.controller.js | [backend/services/delivery-service/routes/delivery.routes.js](backend/services/delivery-service/routes/delivery.routes.js) |
| `PUT /delivery/:deliveryId/status` | Update delivery status | `updateDeliveryStatus()` in delivery.controller.js | [backend/services/delivery-service/routes/delivery.routes.js](backend/services/delivery-service/routes/delivery.routes.js) |

---

## Health Check Endpoints

| Endpoint | What It Does | Function/File | Executed In |
|----------|--------------|---------------|-------------|
| `GET /health/live` | Liveness probe (service alive) | `app.get("/health/live")` | [backend/services/order-service/src/index.js](backend/services/order-service/src/index.js) |
| `GET /health/ready` | Readiness probe (dependencies available) | `app.get("/health/ready")` | [backend/services/order-service/src/index.js](backend/services/order-service/src/index.js) |
