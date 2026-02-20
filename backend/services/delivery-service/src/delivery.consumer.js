const { getRabbit, getDb } = require("../db");

async function startConsumer() {
  const channel = getRabbit();
  const db = getDb();

  await channel.consume("delivery_queue", async (msg) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      
      if (content.event === "order_ready") {
        await db.query(
          `INSERT INTO deliveries (order_id, status) VALUES ($1, $2) ON CONFLICT (order_id) DO NOTHING`,
          [content.order_id, 'PENDING']
        );
        console.log(`[Delivery Service] Order ${content.order_id} is ready for pickup!`);
      }
      channel.ack(msg);
    } catch (err) {
      console.error("Delivery consumer error:", err.message);
      channel.nack(msg, false, true);
    }
  });
}

module.exports = startConsumer;
