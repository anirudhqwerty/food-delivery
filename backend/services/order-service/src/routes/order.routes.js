const express = require("express");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const idempotency = require("../middleware/idempotency");
const orderController = require("../controllers/order.controller");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.post(
  "/",
  rateLimit,
  authenticate,
  requireRole("customer"),
  idempotency,
  orderController.createOrder
);

module.exports = router;
