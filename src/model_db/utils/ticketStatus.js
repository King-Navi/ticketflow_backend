export const TICKET_STATUS = Object.freeze({
  SOLD: 1,
  CHECKED_IN: 2,
  REFUNDED: 3,
  CANCELED: 4,
});

export const TICKET_STATUS_CODE = Object.freeze({
  sold: TICKET_STATUS.SOLD,
  checked_in: TICKET_STATUS.CHECKED_IN,
  refunded: TICKET_STATUS.REFUNDED,
  canceled: TICKET_STATUS.CANCELED,
});

export const TICKET_STATUS_ID_TO_CODE = Object.freeze({
  [TICKET_STATUS.SOLD]: "sold",
  [TICKET_STATUS.CHECKED_IN]: "checked_in",
  [TICKET_STATUS.REFUNDED]: "refunded",
  [TICKET_STATUS.CANCELED]: "canceled",
});

export const isTicketBlockingSeat = (ticketStatusId) =>
  ticketStatusId === TICKET_STATUS.SOLD ||
  ticketStatusId === TICKET_STATUS.CHECKED_IN;

export const isTicketReleasingSeat = (ticketStatusId) =>
  ticketStatusId === TICKET_STATUS.REFUNDED ||
  ticketStatusId === TICKET_STATUS.CANCELED;
