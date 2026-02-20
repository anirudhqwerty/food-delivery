const express = require("express");
const { updateDeliveryStatus, getAvailableDeliveries } = require("../src/delivery.controller");

const router = express.Router();

router.put("/:deliveryId/status", updateDeliveryStatus);
router.get("/available", getAvailableDeliveries);

module.exports = router;
