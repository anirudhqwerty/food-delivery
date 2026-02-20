const { getDb, getRabbit } = require("../db");

async function updateDeliveryStatus(req, res) {
  const { deliveryId } = req.params;
  const { status, driver_id } = req.body; 

  const db = getDb();
  const channel = getRabbit();

  try {
    const result = await db.query(
      `UPDATE deliveries SET status = $1, driver_id = COALESCE($2, driver_id), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING id, order_id, driver_id, status`,
      [status, driver_id, deliveryId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Delivery not found" });
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
