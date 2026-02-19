const express = require("express");
const authenticate = require("../middleware/vendor-auth");
const { createOrder, getOrder, updateOrderStatus } = require("../src/order.controller");

const router = express.Router();

router.post("/", authenticate, createOrder);
router.get("/:orderId", authenticate, getOrder);
router.patch("/:orderId/status", authenticate, updateOrderStatus);

module.exports = router;
