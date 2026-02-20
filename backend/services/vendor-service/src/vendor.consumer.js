const { getRabbit } = require("./rabbit");
const pool = require("../db");

async function startConsumer() {
  const channel = getRabbit();

  await channel.consume("vendor_queue", async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());

      // Expecting event like 'order_vendor_accepted' and payload with items: [{ menu_item_id, quantity }, ...]
      if (content.event === "order_vendor_accepted" || content.event === "order_vendor_accepted") {
        const items = content.items || [];

        if (items.length === 0) {
          console.log("Vendor consumer: no items in order_vendor_accepted event");
        } else {
          for (const item of items) {
            if (!item.menu_item_id || item.quantity === undefined) continue;
            try {
              await pool.query(
                `UPDATE menu_items SET quantity = GREATEST(quantity - $1, 0) WHERE id = $2`,
                [item.quantity, item.menu_item_id]
              );
            } catch (dbErr) {
              console.error("Failed to update menu item quantity:", dbErr.message);
            }
          }
          console.log("Vendor consumer: inventory updated for order", content.order_id || "(unknown)");
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error("Vendor consumer error:", err.message);
      channel.nack(msg, false, true);
    }
  });
}

module.exports = startConsumer;
