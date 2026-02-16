const pool = require("../config/db");
const { insertOutboxEvent } = require("../events/outbox");
const eventTypes = require("../events/event.types");
const { createEventEnvelope } = require("../events/eventEnvelope");
const { getMenuItemById } = require("./vendor.client");

function normalizeItems(items) {
  const byId = new Map();
  for (const item of items) {
    if (!item || !item.menu_item_id) continue;
    const currentQty = byId.get(item.menu_item_id) || 0;
    byId.set(item.menu_item_id, currentQty + (item.quantity || 0));
  }
  return [...byId.entries()].map(([menu_item_id, quantity]) => ({
    menu_item_id,
    quantity,
  }));
}

async function createOrder(customerId, restaurantId, items, { requestId } = {}) {
  if (!items || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const normalizedItems = normalizeItems(items);
  if (normalizedItems.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  for (const item of normalizedItems) {
    if (!item.menu_item_id) throw new Error("menu_item_id is required");
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("quantity must be a positive integer");
    }
  }

  const menuItems = await Promise.all(
    normalizedItems.map((item) => getMenuItemById(item.menu_item_id))
  );

  let totalAmount = 0;
  const validatedItems = [];

  for (let i = 0; i < normalizedItems.length; i++) {
    const item = normalizedItems[i];
    const menuItem = menuItems[i];

    if (menuItem.restaurant_id !== restaurantId) {
      throw new Error("Item does not belong to the specified restaurant");
    }

    if (item.quantity > menuItem.quantity) {
      throw new Error("Requested quantity exceeds available stock");
    }

    const itemTotal = parseFloat(menuItem.price) * item.quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      item_price: menuItem.price,
      quantity: item.quantity,
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, restaurant_id, total_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customerId, restaurantId, totalAmount, "CREATED", "PENDING"]
    );

    const order = orderResult.rows[0];

    const values = [];
    const placeholders = [];
    let param = 1;

    for (const item of validatedItems) {
      placeholders.push(
        `($${param++}, $${param++}, $${param++}, $${param++}, $${param++})`
      );
      values.push(
        order.id,
        item.menu_item_id,
        item.item_name,
        item.item_price,
        item.quantity
      );
    }

    await client.query(
      `INSERT INTO order_items
       (order_id, menu_item_id, item_name, item_price, quantity)
       VALUES ${placeholders.join(", ")}`,
      values
    );

    const event = createEventEnvelope(eventTypes.ORDER_CREATED, {
      orderId: order.id,
      restaurantId,
      customerId,
      totalAmount,
    });

    if (requestId) event.request_id = requestId;

    await insertOutboxEvent(client, {
      eventId: event.event_id,
      routingKey: eventTypes.ORDER_CREATED,
      payload: event,
      aggregateType: "order",
      aggregateId: order.id,
    });

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createOrder,
};
