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

  /**
 * Creates a ticket using the PostgreSQL function fn01_create_ticket_with_qr
 *
 * @param {{
 *   payment_id: number,
 *   event_seat_id: number,
 *   unit_price: number,
 *   ticket_status_code: string
 * }} data
 * @param {{transaction?: import("sequelize").Transaction}} [options]
 * @returns {Promise<number>} ticket_id
 */
async createTicketFromSeat(
  { payment_id, event_seat_id, unit_price, ticket_status_code },
  { transaction } = {}
) {
  if (!payment_id) throw new Error("payment_id is required.");
  if (!event_seat_id) throw new Error("event_seat_id is required.");
  if (!unit_price) throw new Error("unit_price is required.");
  if (!ticket_status_code) throw new Error("ticket_status_code is required.");

  try {
    const sql = `
      SELECT fn01_create_ticket_with_qr(
        :payment_id,
        :event_seat_id,
        :unit_price,
        :ticket_status_code
      ) AS ticket_id;
    `;

    const [rows] = await this.model.sequelize.query(sql, {
      replacements: {
        payment_id,
        event_seat_id,
        unit_price,
        ticket_status_code,
      },
      transaction,
    });

    return rows[0].ticket_id;
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