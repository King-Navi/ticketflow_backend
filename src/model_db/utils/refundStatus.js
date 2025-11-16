export const REFUND_STATUS = Object.freeze({
  REQUESTED: 1,
  APPROVED: 2,
  PROCESSED: 3,
  REJECTED: 4,
});

export const REFUND_STATUS_CODE = Object.freeze({
  requested: REFUND_STATUS.REQUESTED,
  approved: REFUND_STATUS.APPROVED,
  processed: REFUND_STATUS.PROCESSED,
  rejected: REFUND_STATUS.REJECTED,
});

export const REFUND_STATUS_ID_TO_CODE = Object.freeze({
  [REFUND_STATUS.REQUESTED]: "requested",
  [REFUND_STATUS.APPROVED]: "approved",
  [REFUND_STATUS.PROCESSED]: "processed",
  [REFUND_STATUS.REJECTED]: "rejected",
});

export const isRefundFinal = (refundStatusId) =>
  refundStatusId === REFUND_STATUS.PROCESSED ||
  refundStatusId === REFUND_STATUS.REJECTED;