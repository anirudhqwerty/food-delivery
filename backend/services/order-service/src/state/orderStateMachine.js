const allowedTransitions = {
  CREATED: ["VENDOR_ACCEPTED", "VENDOR_REJECTED", "CANCELLED"],
  VENDOR_ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  VENDOR_REJECTED: [],
  CANCELLED: [],
};

function canTransition(currentStatus, nextStatus) {
  const allowed = allowedTransitions[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

function validateTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid state transition from ${currentStatus} to ${nextStatus}`
    );
  }
}

module.exports = {
  canTransition,
  validateTransition,
};
