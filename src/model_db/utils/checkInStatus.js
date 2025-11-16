export const CHECK_IN_STATUS = Object.freeze({
  OK: 1,
  DUPLICATE: 2,
  INVALID: 3,
  OUTSIDE_WINDOW: 4,
});

export const CHECK_IN_STATUS_CODE = Object.freeze({
  ok: CHECK_IN_STATUS.OK,
  duplicate: CHECK_IN_STATUS.DUPLICATE,
  invalid: CHECK_IN_STATUS.INVALID,
  outside_window: CHECK_IN_STATUS.OUTSIDE_WINDOW,
});

export const CHECK_IN_STATUS_ID_TO_CODE = Object.freeze({
  [CHECK_IN_STATUS.OK]: "ok",
  [CHECK_IN_STATUS.DUPLICATE]: "duplicate",
  [CHECK_IN_STATUS.INVALID]: "invalid",
  [CHECK_IN_STATUS.OUTSIDE_WINDOW]: "outside_window",
});

// Helpers opcionales, por si te sirven:

export const isCheckInSuccessful = (checkInStatusId) =>
  checkInStatusId === CHECK_IN_STATUS.OK;

export const isCheckInDuplicate = (checkInStatusId) =>
  checkInStatusId === CHECK_IN_STATUS.DUPLICATE;

export const isCheckInHardError = (checkInStatusId) =>
  checkInStatusId === CHECK_IN_STATUS.INVALID ||
  checkInStatusId === CHECK_IN_STATUS.OUTSIDE_WINDOW;