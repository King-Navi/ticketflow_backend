export const EVENT_SEAT_STATUS = Object.freeze({
  AVAILABLE: 1,
  RESERVED: 2,
  SOLD: 3,
  BLOCKED: 4,
});

export const EVENT_SEAT_STATUS_CODE = Object.freeze({
  available: EVENT_SEAT_STATUS.AVAILABLE,
  reserved: EVENT_SEAT_STATUS.RESERVED,
  sold: EVENT_SEAT_STATUS.SOLD,
  blocked: EVENT_SEAT_STATUS.BLOCKED,
});
