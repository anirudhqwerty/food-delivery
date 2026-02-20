const { getDb, getRabbit } = require("../db");

async function updateDeliveryStatus(req, res) {
  const { deliveryId } = req.params;
  const { status } = req.body;
  const driver_id = req.user.userId; // Extract real driver ID from JWT token

  const db = getDb();
  const channel = getRabbit();

  try {
    // Ensure driver exists in the local drivers table before assigning
    await db.query(
      `INSERT INTO drivers (id, name, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [driver_id, 'Driver', 'N/A']
    );

    let query = "";
    let params = [];

    if (status === "ASSIGNED") {
      // Protect against Race Conditions: Only assign if still PENDING
      query = `UPDATE deliveries 
               SET status = $1, driver_id = $2, updated_at = CURRENT_TIMESTAMP
               WHERE id = $3 AND status = 'PENDING' 
               RETURNING id, order_id, driver_id, status`;
      params = [status, driver_id, deliveryId];
    } else {
      // Protect against hijacking: Only the assigned driver can update their delivery
      query = `UPDATE deliveries 
               SET status = $1, updated_at = CURRENT_TIMESTAMP
               WHERE id = $2 AND driver_id = $3 
               RETURNING id, order_id, driver_id, status`;
      params = [status, deliveryId, driver_id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Delivery no longer available or unauthorized" });
    }

    const delivery = result.rows[0];

    let eventName = "";
    if (status === "PICKED_UP") eventName = "delivery_started";
    if (status === "DELIVERED") eventName = "delivery_completed";

    if (eventName) {
      channel.publish("order_exchange", `delivery.${status.toLowerCase()}`, Buffer.from(JSON.stringify({
        event: eventName,
        order_id: delivery.order_id,
        delivery_id: delivery.id,
        driver_id: delivery.driver_id,
        timestamp: new Date().toISOString(),
      })));
    }

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAvailableDeliveries(req, res) {
  const db = getDb();
  try {
    const result = await db.query(`SELECT * FROM deliveries WHERE status = 'PENDING'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { updateDeliveryStatus, getAvailableDeliveries };
