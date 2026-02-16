const { canTransition, validateTransition } = require("./orderStateMachine");

test("canTransition allows valid transitions", () => {
  expect(canTransition("CREATED", "VENDOR_ACCEPTED")).toBe(true);
  expect(canTransition("READY", "OUT_FOR_DELIVERY")).toBe(true);
});

test("canTransition denies invalid transitions", () => {
  expect(canTransition("CREATED", "DELIVERED")).toBe(false);
  expect(canTransition("DELIVERED", "OUT_FOR_DELIVERY")).toBe(false);
});

test("validateTransition throws on invalid transitions", () => {
  expect(() => validateTransition("CREATED", "DELIVERED")).toThrow(
    /Invalid state transition/
  );
});

