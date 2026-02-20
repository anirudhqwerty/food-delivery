const { getRabbit, getDb } = require("../db");

async function startConsumer() {
  const channel = getRabbit();
  const db = getDb();

  await channel.consume("order_queue", async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      
      console.log(`[Order Consumer] Received event: ${content.event} for order ${content.order_id}`);

      if (content.event === "vendor_rejected") {
        await db.query(
          `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          ["VENDOR_REJECTED", content.order_id]
        );
      } else if (content.event === "order_ready") {
        await db.query(
          `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          ["READY", content.order_id]
        );
      } else if (content.event === "delivery_started") {
        await db.query(
          `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          ["OUT_FOR_DELIVERY", content.order_id]
        );
      } else if (content.event === "delivery_completed") {
        await db.query(
          `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          ["DELIVERED", content.order_id]
        );
      }

      channel.ack(msg);
    } catch (err) {
      console.error("Consumer error:", err);
      channel.nack(msg, false, true);
    }
  });
}

module.exports = startConsumer;
