const pool = require("../config/db");
const publishEvent = require("./publisher");
const logger = require("../utils/logger");

const DEFAULT_BATCH_SIZE = parseInt(process.env.OUTBOX_BATCH_SIZE || "25", 10);
const DEFAULT_INTERVAL_MS = parseInt(
  process.env.OUTBOX_POLL_INTERVAL_MS || "500",
  10
);
const MAX_ATTEMPTS = parseInt(process.env.OUTBOX_MAX_ATTEMPTS || "10", 10);

async function claimNextBatch(client, batchSize) {
  const result = await client.query(
    `SELECT *
     FROM outbox_events
     WHERE published_at IS NULL
       AND dead_lettered_at IS NULL
       AND attempts < $1
     ORDER BY occurred_at ASC
     FOR UPDATE SKIP LOCKED
     LIMIT $2`,
    [MAX_ATTEMPTS, batchSize]
  );
  return result.rows;
}

async function markPublished(client, id) {
  await client.query(
    `UPDATE outbox_events
     SET published_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id]
  );
}

async function markFailed(client, id, err) {
  await client.query(
    `UPDATE outbox_events
     SET attempts = attempts + 1,
         last_error = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id, String(err && err.message ? err.message : err)]
  );
}

async function markDeadLettered(client, id, err) {
  await client.query(
    `UPDATE outbox_events
     SET dead_lettered_at = CURRENT_TIMESTAMP,
         last_error = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id, String(err && err.message ? err.message : err)]
  );
}

async function processOnce({ batchSize = DEFAULT_BATCH_SIZE } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const events = await claimNextBatch(client, batchSize);
    if (events.length === 0) {
      await client.query("COMMIT");
      return 0;
    }

    // Process inside the same tx so SKIP LOCKED stays effective, but keep it short.
    for (const evt of events) {
      try {
        await publishEvent(evt.routing_key, evt.payload);
        await markPublished(client, evt.id);
      } catch (err) {
        await markFailed(client, evt.id, err);
        if (evt.attempts + 1 >= MAX_ATTEMPTS) {
          await markDeadLettered(client, evt.id, err);
          logger.error("Outbox event dead-lettered", {
            outbox_id: evt.id,
            routing_key: evt.routing_key,
            event_id: evt.event_id,
          });
        }
      }
    }

    await client.query("COMMIT");
    return events.length;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function startOutboxWorker({
  intervalMs = DEFAULT_INTERVAL_MS,
  batchSize = DEFAULT_BATCH_SIZE,
} = {}) {
  let stopped = false;

  const timer = setInterval(async () => {
    if (stopped) return;
    try {
      await processOnce({ batchSize });
    } catch (err) {
      logger.error("Outbox worker error", { err: String(err) });
    }
  }, intervalMs);

  timer.unref?.();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

module.exports = { startOutboxWorker, processOnce };

