const express = require("express");
const authenticate = require("../middleware/vendor-auth");
const { createOrder, getOrder, updateOrderStatus, getRestaurantOrders } = require("../src/order.controller");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/", authenticate, asyncHandler(createOrder));
router.get("/:orderId", authenticate, asyncHandler(getOrder));
router.get("/restaurant/:restaurantId", asyncHandler(getRestaurantOrders));
router.patch("/:orderId/status", authenticate, asyncHandler(updateOrderStatus));

module.exports = router;
