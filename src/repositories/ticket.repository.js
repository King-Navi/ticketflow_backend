import { Sequelize } from "sequelize";
import TicketModel from "../model_db/ticket.js";
import { TICKET_STATUS } from "../model_db/utils/ticketStatus.js";



export default class TicketRepository {
  constructor(model = TicketModel) {
    this.model = model;
  }

  /**
   * Find ticket for a given event_seat_id (remember: it's UNIQUE in your schema)
   *
   * @param {number} eventSeatId
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<object|null>}
   */
  async findByEventSeatId(eventSeatId, { transaction } = {}) {
    if (!eventSeatId) {
      throw new Error("eventSeatId is required.");
    }

    try {
      const rec = await this.model.findOne({
        where: { event_seat_id: eventSeatId },
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

  async findAllByEventSeatId(eventSeatId, { transaction } = {}) {
    if (!eventSeatId) {
      throw new Error("eventSeatId is required.");
    }

    try {
      const rows = await this.model.findAll({
        where: { event_seat_id: eventSeatId },
        transaction,
      });
      return rows.map(r => r.get({ plain: true }));
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
   * Helper: tells if a ticket status blocks a new reservation
   * (sold / checked_in)
   *
   * @param {number} ticketStatusId
   * @returns {boolean}
   */
  isBlockingStatus(ticketStatusId) {
    return (
      ticketStatusId === TICKET_STATUS.SOLD ||
      ticketStatusId === TICKET_STATUS.CHECKED_IN
    );
  }

  /**
   * Returns true if this ticket_status_id allows a new reservation.
   * (refunded, canceled)
   *
   * @param {number} ticketStatusId
   * @returns {boolean}
   */
  isReleasingStatus(ticketStatusId) {
    return (
      ticketStatusId === TICKET_STATUS.REFUNDED ||
      ticketStatusId === TICKET_STATUS.CANCELED
    );
  }
}