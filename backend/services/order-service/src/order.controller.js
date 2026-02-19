const { v4: uuidv4 } = require("uuid");
const { getDb, getRabbit, getRedis } = require("../db");

async function createOrder(req, res) {
  const customerId = req.user?.sub;
  if (!customerId) return res.status(401).json({ error: "Unauthorized" });

  const { restaurant_id, items, total_amount } = req.body;

  if (!restaurant_id || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const db = getDb();
  const channel = getRabbit();
  const redis = getRedis();

  try {
    const orderId = uuidv4();
    
    await db.query("BEGIN");
    
    const orderResult = await db.query(
      `INSERT INTO orders (id, customer_id, restaurant_id, total_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_id, restaurant_id, total_amount, status, created_at`,
      [orderId, customerId, restaurant_id, total_amount, "CREATED", "PENDING"]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.name, item.price, item.quantity]
      );
    }

    await db.query("COMMIT");

    const orderMsg = {
      event: "order_created",
      order_id: orderId,
      customer_id: customerId,
      restaurant_id,
      total_amount,
      items,
      timestamp: new Date().toISOString(),
    };

    channel.publish("order_exchange", "order.created", Buffer.from(JSON.stringify(orderMsg)));

    await redis.setex(`order:${orderId}`, 3600, JSON.stringify(order));

    res.status(201).json(order);
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    res.status(500).json({ error: err.message });
  }
}

async function getOrder(req, res) {
  const customerId = req.user?.sub;
  const { orderId } = req.params;

  if (!customerId) return res.status(401).json({ error: "Unauthorized" });

  const redis = getRedis();
  const db = getDb();

  try {
    const cached = await redis.get(`order:${orderId}`);
    if (cached) return res.json(JSON.parse(cached));

    const result = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND customer_id = $2`,
      [orderId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];
    await redis.setex(`order:${orderId}`, 3600, JSON.stringify(order));

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const validStatuses = [
    "CREATED", "VENDOR_ACCEPTED", "VENDOR_REJECTED", "PREPARING",
    "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const db = getDb();
  const channel = getRabbit();
  const redis = getRedis();

  try {
    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, customer_id, restaurant_id, total_amount, status, created_at`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

    channel.publish("order_exchange", `order.${status.toLowerCase()}`, Buffer.from(
      JSON.stringify({
        event: `order_${status.toLowerCase()}`,
        order_id: orderId,
        status,
        timestamp: new Date().toISOString(),
      })
    ));

    await redis.del(`order:${orderId}`);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrder,
  updateOrderStatus,
};
