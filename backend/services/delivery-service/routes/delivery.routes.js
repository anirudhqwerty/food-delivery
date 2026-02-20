const express = require("express");
const authenticate = require("../middleware/auth");
const { updateDeliveryStatus, getAvailableDeliveries } = require("../src/delivery.controller");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/available", authenticate, asyncHandler(getAvailableDeliveries));
router.put("/:deliveryId/status", authenticate, asyncHandler(updateDeliveryStatus));

module.exports = router;
