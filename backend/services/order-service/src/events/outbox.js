async function insertOutboxEvent(
  client,
  { eventId, routingKey, payload, aggregateType, aggregateId }
) {
  await client.query(
    `INSERT INTO outbox_events
     (event_id, routing_key, payload, aggregate_type, aggregate_id, occurred_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
    [eventId, routingKey, payload, aggregateType, aggregateId]
  );
}

module.exports = { insertOutboxEvent };

