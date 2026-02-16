const { createEventEnvelope } = require("./eventEnvelope");

test("createEventEnvelope creates a versioned envelope", () => {
  const evt = createEventEnvelope("order.created.v1", { a: 1 });
  expect(evt.event_id).toBeTruthy();
  expect(evt.event_type).toBe("order.created.v1");
  expect(evt.event_version).toBe(1);
  expect(evt.service_name).toBeTruthy();
  expect(evt.data).toEqual({ a: 1 });
  expect(new Date(evt.occurred_at).toString()).not.toBe("Invalid Date");
});

