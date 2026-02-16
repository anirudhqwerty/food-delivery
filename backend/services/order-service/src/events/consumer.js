const { getChannel } = require("../config/rabbitmq");
const eventTypes = require("./event.types");
const pool = require("../config/db");
const { validateTransition } = require("../state/orderStateMachine");
const { withRedisLock } = require("../utils/redisLock");
const logger = require("../utils/logger");

async function startConsumer() {
  const channel = getChannel();

  await channel.assertExchange("order_exchange_dlx", "direct", {
    durable: true,
  });

  const queue = await channel.assertQueue("order_service_queue", {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "order_exchange_dlx",
      "x-dead-letter-routing-key": "order.dead",
    },
  });

  await channel.assertQueue("order_service_dlq", { durable: true });
  await channel.bindQueue("order_service_dlq", "order_exchange_dlx", "order.dead");

  await channel.bindQueue(queue.queue, "order_exchange", "order.*.v1");

  channel.consume(queue.queue, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;
    const envelope = JSON.parse(msg.content.toString());

    const eventId = envelope.event_id;
    const data = envelope.data || {};

    if (!eventId) {
      logger.error("Dropping event without event_id", { routingKey });
      channel.ack(msg);
      return;
    }

    try {
      const targetStatusByRoutingKey = {
        [eventTypes.ORDER_ACCEPTED]: "VENDOR_ACCEPTED",
        [eventTypes.ORDER_REJECTED]: "VENDOR_REJECTED",
        [eventTypes.ORDER_READY]: "READY",
        [eventTypes.ORDER_OUT_FOR_DELIVERY]: "OUT_FOR_DELIVERY",
        [eventTypes.ORDER_DELIVERED]: "DELIVERED",
      };

      const nextStatus = targetStatusByRoutingKey[routingKey];
      if (!nextStatus) {
        channel.ack(msg);
        return;
      }

      const orderId = data.orderId;
      if (!orderId) throw new Error("Missing data.orderId");

      await withRedisLock(`lock:order:${orderId}`, { ttlMs: 5000, waitMs: 2000 }, async () => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const dedupe = await client.query(
            `INSERT INTO processed_events (event_id, event_type)
             VALUES ($1, $2)
             ON CONFLICT (event_id) DO NOTHING
             RETURNING event_id`,
            [eventId, routingKey]
          );

          if (dedupe.rows.length === 0) {
            await client.query("COMMIT");
            return;
          }

          const current = await client.query(
            "SELECT status, version FROM orders WHERE id = $1 FOR UPDATE",
            [orderId]
          );

          if (current.rows.length === 0) {
            await client.query("COMMIT");
            return;
          }

          const { status: currentStatus, version } = current.rows[0];
          validateTransition(currentStatus, nextStatus);

          const updated = await client.query(
            `UPDATE orders
             SET status = $1,
                 version = version + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND version = $3`,
            [nextStatus, orderId, version]
          );

          if (updated.rowCount !== 1) {
            throw new Error("Optimistic lock failed");
          }

          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      });

      channel.ack(msg);
    } catch (err) {
      logger.error("Consumer error", { err: String(err), routingKey });
      channel.nack(msg, false, false);
    }
  });
}

module.exports = startConsumer;
