// Hardcoded IDs based on the exact seed order.
// Make sure your SQL seed inserts in this order with an empty table:
// 1. draft, 2. scheduled, 3. on_sale, 4. paused,
// 5. edit_lock, 6. closed, 7. completed, 8. canceled

export const EVENT_STATUS = Object.freeze({
  DRAFT: 1,
  SCHEDULED: 2,
  ON_SALE: 3,
  PAUSED: 4,
  EDIT_LOCK: 5,
  CLOSED: 6,
  COMPLETED: 7,
  CANCELED: 8,
});

export const EVENT_STATUS_CODE = Object.freeze({
  draft: EVENT_STATUS.DRAFT,
  scheduled: EVENT_STATUS.SCHEDULED,
  on_sale: EVENT_STATUS.ON_SALE,
  paused: EVENT_STATUS.PAUSED,
  edit_lock: EVENT_STATUS.EDIT_LOCK,
  closed: EVENT_STATUS.CLOSED,
  completed: EVENT_STATUS.COMPLETED,
  canceled: EVENT_STATUS.CANCELED,
});

export const EVENT_STATUS_ID_TO_CODE = Object.freeze({
  [EVENT_STATUS.DRAFT]: "draft",
  [EVENT_STATUS.SCHEDULED]: "scheduled",
  [EVENT_STATUS.ON_SALE]: "on_sale",
  [EVENT_STATUS.PAUSED]: "paused",
  [EVENT_STATUS.EDIT_LOCK]: "edit_lock",
  [EVENT_STATUS.CLOSED]: "closed",
  [EVENT_STATUS.COMPLETED]: "completed",
  [EVENT_STATUS.CANCELED]: "canceled",
});

export const isOnSale = (eventStatusId) => eventStatusId === EVENT_STATUS.ON_SALE;
export const isEditLocked = (eventStatusId) => eventStatusId === EVENT_STATUS.EDIT_LOCK;
export const canSell = (eventStatusId) => eventStatusId === EVENT_STATUS.ON_SALE;
export const canEditStructure = (eventStatusId) =>
  eventStatusId === EVENT_STATUS.DRAFT || eventStatusId === EVENT_STATUS.EDIT_LOCK;