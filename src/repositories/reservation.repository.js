import { Sequelize } from "sequelize";
import ReservationModel from "../model_db/reservation.js";

const { Op } = Sequelize;

export default class ReservationRepository {
  constructor(model = ReservationModel) {
    this.model = model;
  }

  /**
   * Find an active and not-expired reservation for a given event seat.
   * This is the one that should block a new reservation.
   *
   * @param {number} eventSeatId
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<object|null>}
   */
  async findActiveNotExpiredByEventSeatId(eventSeatId, { transaction } = {}) {
    if (!eventSeatId) {
      throw new Error("eventSeatId is required.");
    }

    try {
      const now = new Date();
      const rec = await this.model.findOne({
        where: {
          event_seat_id: eventSeatId,
          status: "active",
          expiration_at: { [Op.gt]: now },
        },
        transaction,
      });

      return rec ? rec.get({ plain: true }) : null;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }

  /**
   * Create a reservation row.
   *
   * @param {{attendee_id:number, event_seat_id:number, expiration_at:Date|string}} data
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<object>} created reservation (plain)
   */
  async createReservation(data, { transaction } = {}) {
    const { attendee_id, event_seat_id, expiration_at } = data || {};
    if (!attendee_id) throw new Error("attendee_id is required.");
    if (!event_seat_id) throw new Error("event_seat_id is required.");
    if (!expiration_at) throw new Error("expiration_at is required.");

    try {
      const rec = await this.model.create(
        {
          attendee_id,
          event_seat_id,
          expiration_at,
          status: "active",
        },
        { transaction }
      );
      return rec.get({ plain: true });
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }

  /**
   * Mark a reservation as expired
   */
  async markExpired(reservationId, { transaction } = {}) {
    if (!reservationId) throw new Error("reservationId is required.");
    try {
      const [count] = await this.model.update(
        {
          status: "expired",
          updated_at: new Date(),
        },
        {
          where: { reservation_id: reservationId },
          transaction,
        }
      );
      return count > 0;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }
}
