const orderService = require("../services/order.service");
const { createOrderSchema } = require("../validators/order.schema");

async function createOrder(req, res) {
  const customerId = req.user && req.user.sub;
  if (!customerId) return res.status(401).json({ error: "Unauthorized" });

  const { error, value } = createOrderSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      error: "Invalid request",
      details: error.details.map((d) => d.message),
    });
  }

  try {
    const order = await orderService.createOrder(
      customerId,
      value.restaurant_id,
      value.items,
      { requestId: req.requestId }
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
};
