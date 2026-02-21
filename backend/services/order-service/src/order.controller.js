const { randomUUID } = require("crypto");
const { getDb, getRabbit } = require("../db");

async function createOrder(req, res) {
  const customerId = req.user?.sub;
  if (!customerId) return res.status(401).json({ error: "Unauthorized" });

  const { restaurant_id, items, total_amount } = req.body;

  console.log("Order request body:", { restaurant_id, items, total_amount });

  // Validate required fields
  if (!restaurant_id) {
    return res.status(400).json({ error: "Invalid request body: restaurant_id is required" });
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid request body: items must be a non-empty array" });
  }
  
  if (!total_amount || parseFloat(total_amount) <= 0) {
    return res.status(400).json({ error: "Invalid request body: total_amount must be a positive number" });
  }

  const db = getDb();
  const channel = getRabbit();

  try {
    const orderId = randomUUID();
    
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

  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND customer_id = $2`,
      [orderId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

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

    // When vendor accepts, include items in published event so Vendor Service can update inventory
    let itemsPayload = null;
    if (status === "VENDOR_ACCEPTED") {
      try {
        const itemsResult = await db.query(
          `SELECT menu_item_id as menu_item_id, quantity FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        if (itemsResult.rows.length > 0) {
          itemsPayload = itemsResult.rows.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity
          }));
        }
      } catch (inventoryErr) {
        console.error(`[Order ${orderId}] Failed to fetch order items for vendor event:`, inventoryErr.message);
      }
    }

    const eventPayload = {
      event: `order_${status.toLowerCase()}`,
      order_id: orderId,
      status,
      timestamp: new Date().toISOString(),
    };

    if (itemsPayload) eventPayload.items = itemsPayload;

    channel.publish("order_exchange", `order.${status.toLowerCase()}`, Buffer.from(JSON.stringify(eventPayload)));

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRestaurantOrders(req, res) {
  const { restaurantId } = req.params;
  
  if (!restaurantId) {
    return res.status(400).json({ error: "Restaurant ID is required" });
  }

  const db = getDb();

  try {
    const result = await db.query(
      `SELECT o.id, o.customer_id, o.restaurant_id, o.total_amount::numeric, o.status, o.created_at,
              COALESCE(json_agg(json_build_object('id', oi.id, 'item_name', oi.item_name, 'price', oi.item_price, 'quantity', oi.quantity)) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.restaurant_id = $1 AND o.status NOT IN ('DELIVERED', 'CANCELLED')
       GROUP BY o.id, o.customer_id, o.restaurant_id, o.total_amount, o.status, o.created_at
       ORDER BY o.created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching restaurant orders:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrder,
  updateOrderStatus,
  getRestaurantOrders,
};
