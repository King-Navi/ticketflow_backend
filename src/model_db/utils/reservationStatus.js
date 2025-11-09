export const RESERVATION_STATUS = Object.freeze({
  ACTIVE: "active",
  EXPIRED: "expired",
  CONVERTED: "converted",
  CANCELED: "canceled",
});

export const RESERVATION_STATUS_LIST = Object.freeze([
  RESERVATION_STATUS.ACTIVE,
  RESERVATION_STATUS.EXPIRED,
  RESERVATION_STATUS.CONVERTED,
  RESERVATION_STATUS.CANCELED,
]);

export function isValidReservationStatus(value) {
  return RESERVATION_STATUS_LIST.includes(value);
}