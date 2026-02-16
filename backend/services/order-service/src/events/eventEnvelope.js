const { randomUUID } = require("crypto");

const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

function createEventEnvelope(eventType, data) {
  return {
    event_id: randomUUID(),
    event_type: eventType,
    event_version: 1,
    occurred_at: new Date().toISOString(),
    service_name: SERVICE_NAME,
    data,
  };
}

module.exports = { createEventEnvelope };
