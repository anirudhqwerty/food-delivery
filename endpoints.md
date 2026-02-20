# Food Delivery API Endpoints

Complete documentation of all endpoints across the Food Delivery microservices architecture.

---

## Authentication Service (Port 5000)

Base URL: `http://localhost/auth`

### 1. Register
- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user (customer, vendor, or delivery personnel)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "customer|vendor|delivery"
  }
  ```
- **Response:** JWT token and user details
- **Status:** 201 Created / 400 Bad Request / 500 Server Error
- **Authentication:** None required

### 2. Login
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate user and return JWT token
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** JWT token and user details (id, email, role)
- **Status:** 200 OK / 401 Unauthorized / 500 Server Error
- **Authentication:** None required

### 3. Get Current User
- **Endpoint:** `GET /auth/me`
- **Description:** Get current authenticated user's profile information
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response:** Current user details (id, email, role)
- **Status:** 200 OK / 401 Unauthorized
- **Authentication:** Required (Bearer token)

---

## Vendor Service (Port 5001)

Base URL: `http://localhost/vendor`

### Protected Routes (Vendor Authentication Required)

#### 1. Get Vendor's Restaurant
- **Endpoint:** `GET /vendor/restaurant`
- **Description:** Retrieve vendor's restaurant details. Creates a default restaurant if none exists.
- **Response:** Restaurant object with id, vendor_id, name, description, created_at
- **Status:** 200 OK / 500 Server Error
- **Authentication:** Required

#### 2. Create Restaurant
- **Endpoint:** `POST /vendor/restaurant`
- **Description:** Create a new restaurant for the vendor (one restaurant per vendor)
- **Request Body:**
  ```json
  {
    "name": "Restaurant Name",
    "description": "Restaurant description"
  }
  ```
- **Response:** Created restaurant object
- **Status:** 201 Created / 400 Bad Request / 500 Server Error
- **Authentication:** Required

#### 3. Update Restaurant
- **Endpoint:** `PUT /vendor/restaurant`
- **Description:** Update vendor's restaurant details
- **Request Body:**
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description"
  }
  ```
- **Response:** Updated restaurant object
- **Status:** 200 OK / 404 Not Found / 400 Bad Request / 500 Server Error
- **Authentication:** Required

#### 4. Get Menu Items
- **Endpoint:** `GET /vendor/menu`
- **Description:** Get all menu items for vendor's restaurant
- **Response:** Array of menu item objects with id, name, description, price, quantity, is_available
- **Status:** 200 OK / 500 Server Error
- **Authentication:** Required

#### 5. Add Menu Item
- **Endpoint:** `POST /vendor/menu`
- **Description:** Add a new menu item to vendor's restaurant
- **Request Body:**
  ```json
  {
    "name": "Dish Name",
    "description": "Dish description",
    "price": 9.99,
    "quantity": 50
  }
  ```
- **Response:** Created menu item object
- **Status:** 201 Created / 400 Bad Request / 404 Not Found / 500 Server Error
- **Authentication:** Required

#### 6. Update Menu Item
- **Endpoint:** `PUT /vendor/menu/:id`
- **Description:** Update a menu item (name, description, price, quantity, availability)
- **Request Body:**
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "price": 12.99,
    "quantity": 45,
    "is_available": true
  }
  ```
- **Response:** Updated menu item object
- **Status:** 200 OK / 404 Not Found / 400 Bad Request / 500 Server Error
- **Authentication:** Required

#### 7. Delete Menu Item
- **Endpoint:** `DELETE /vendor/menu/:id`
- **Description:** Delete a menu item from vendor's restaurant
- **Response:** Success message
- **Status:** 200 OK / 404 Not Found / 500 Server Error
- **Authentication:** Required

### Public Routes (No Authentication Required)

#### 8. Get All Restaurants
- **Endpoint:** `GET /vendor/public/restaurants`
- **Description:** Get list of all restaurants (for customer feed)
- **Response:** Array of restaurant objects with id, name, description
- **Status:** 200 OK / 500 Server Error
- **Authentication:** Not required

#### 9. Get Available Menu Items
- **Endpoint:** `GET /vendor/public/menu`
- **Description:** Get all available menu items from all restaurants
- **Response:** Array of menu items with restaurant info
- **Status:** 200 OK / 500 Server Error
- **Authentication:** Not required

#### 10. Get Single Menu Item
- **Endpoint:** `GET /vendor/public/menu/:id`
- **Description:** Get a single available menu item by ID (used by order service)
- **Response:** Menu item object
- **Status:** 200 OK / 404 Not Found / 500 Server Error
- **Authentication:** Not required

### Internal Routes (Called by Order Service)

#### 11. Update Inventory
- **Endpoint:** `PATCH /vendor/internal/inventory`
- **Description:** Internal endpoint to decrease menu item quantities when orders are placed
- **Request Body:**
  ```json
  {
    "items": [
      { "menu_item_id": 1, "quantity": 2 },
      { "menu_item_id": 3, "quantity": 1 }
    ]
  }
  ```
- **Response:** Success message
- **Status:** 200 OK / 400 Bad Request / 500 Server Error
- **Authentication:** Not required (internal service-to-service call)

---

## Order Service (Port 5002)

Base URL: `http://localhost/order`

### 1. Create Order
- **Endpoint:** `POST /order`
- **Description:** Create a new order with items
- **Request Body:**
  ```json
  {
    "restaurantId": 1,
    "customerId": 1,
    "items": [
      { "menuItemId": 1, "quantity": 2 },
      { "menuItemId": 3, "quantity": 1 }
    ],
    "totalPrice": 25.99,
    "deliveryAddress": "123 Main St"
  }
  ```
- **Response:** Created order object
- **Status:** 201 Created / 400 Bad Request / 500 Server Error
- **Authentication:** Required

### 2. Get Order Details
- **Endpoint:** `GET /order/:orderId`
- **Description:** Get details of a specific order
- **Response:** Order object with items, status, total price, timestamps
- **Status:** 200 OK / 404 Not Found / 500 Server Error
- **Authentication:** Required

### 3. Get Restaurant Orders
- **Endpoint:** `GET /order/restaurant/:restaurantId`
- **Description:** Get all orders for a specific restaurant
- **Response:** Array of order objects
- **Status:** 200 OK / 500 Server Error
- **Authentication:** Not required

### 4. Update Order Status
- **Endpoint:** `PATCH /order/:orderId/status`
- **Description:** Update the status of an order (e.g., pending → confirmed → preparing → ready → out_for_delivery → delivered)
- **Request Body:**
  ```json
  {
    "status": "preparing"
  }
  ```
- **Response:** Updated order object
- **Status:** 200 OK / 404 Not Found / 400 Bad Request / 500 Server Error
- **Authentication:** Required

---

## Health Check Endpoints

### Auth Service Health Check
- **Endpoint:** `GET /auth/health`
- **Description:** Check if auth service is running
- **Response:** `{ "status": "auth service running" }`

### Vendor Service Health Check
- **Endpoint:** `GET /vendor/health`
- **Description:** Check if vendor service is running
- **Response:** `{ "status": "vendor service running" }`

### Order Service - Liveness Probe
- **Endpoint:** `GET /order/health/live`
- **Description:** Check if order service is alive
- **Response:** `{ "status": "live" }`

### Order Service - Readiness Probe
- **Endpoint:** `GET /order/health/ready`
- **Description:** Check if order service is ready (all dependencies available)
- **Response:** `{ "status": "ready" }`

---

## Service Architecture

```
Client Apps (Customer, Vendor, Delivery)
           ↓
        NGINX (Port 80)
           ↓
    ┌──────┴───────┬─────────┐
    ↓              ↓         ↓
Auth Service   Vendor Service   Order Service
(Port 5000)    (Port 5001)      (Port 5002)
```

## Response Codes Summary

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal server error |
| 503 | Service Unavailable - Dependencies not ready |

---

## Authentication Flow

1. User calls `POST /auth/register` or `POST /auth/login`
2. Receives JWT token in response
3. Include token in subsequent requests: `Authorization: Bearer <TOKEN>`
4. Verify token with `GET /auth/me`

---

## Common Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Real-IP: Client IP (set by nginx)
X-Forwarded-For: Client IPs (set by nginx)
```
