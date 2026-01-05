import { Sequelize } from "sequelize";
import ReservationModel from "../../model_db/reservation.js";
import EventSeatModel from "../../model_db/event_seat.js";
import { EVENT_SEAT_STATUS } from "../../model_db/utils/eventSeatStatus.js";
import { sequelizeCon } from "../../config/initPostgre.js";
import { RESERVATION_STATUS } from "../../model_db/utils/reservationStatus.js";

const { Op } = Sequelize;
export async function expireReservationsService(limit = 500) {
  return sequelizeCon.transaction(async (tx) => {
    const now = new Date();

    const expiredReservations = await ReservationModel.findAll({
      where: {
        status: RESERVATION_STATUS.ACTIVE,
        expiration_at: { [Op.lte]: now },
      },
      attributes: ["reservation_id", "event_seat_id"],
      order: [["expiration_at", "ASC"]],
      limit,
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (expiredReservations.length === 0) {
      return { expiredCount: 0 };
    }

    const reservationIds = expiredReservations.map((r) => r.reservation_id);
    const eventSeatIds = expiredReservations.map((r) => r.event_seat_id);

    // 1) Mark reservations as expired
    await ReservationModel.update(
      { status: RESERVATION_STATUS.EXPIRED, updated_at: now },
      {
        where: {
          reservation_id: { [Op.in]: reservationIds },
        },
        transaction: tx,
      }
    );

    // 2) Free seats that are still RESERVED
    await EventSeatModel.update(
      { event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE, updated_at: now },
      {
        where: {
          event_seat_id: { [Op.in]: eventSeatIds },
          event_seat_status_id: EVENT_SEAT_STATUS.RESERVED,
        },
        transaction: tx,
      }
    );

    return { expiredCount: reservationIds.length };
  });
}
