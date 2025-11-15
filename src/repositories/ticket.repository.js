import { Sequelize, QueryTypes } from "sequelize";
import TicketModel from "../model_db/ticket.js";
import { TICKET_STATUS } from "../model_db/utils/ticketStatus.js";
import { sequelizeCon } from "../config/initPostgre.js";


export default class TicketRepository {
  constructor(model = TicketModel, sequelize = sequelizeCon) {
    this.model = model;
    this.sequelize = sequelize;
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
    {
      payment_id,
      event_seat_id,
      unit_price,
      category_label,
      seat_label,
    },
    { transaction } = {}
  ) {
    if (!payment_id) throw new Error("payment_id is required.");
    if (!event_seat_id) throw new Error("event_seat_id is required.");
    if (unit_price == null) throw new Error("unit_price is required.");
    if (!category_label) throw new Error("category_label is required.");
    if (!seat_label) throw new Error("seat_label is required.");

    try {
      const [row] = await this.sequelize.query(`
      SELECT
          out_ticket_id,
          out_ticket_qr_id,
          out_token,
          out_reissued
        FROM fn01_create_ticket_with_qr(
          :eventSeatId,
          :paymentId,
          :categoryLabel,
          :seatLabel,
          :unitPrice
        );
        `,
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: {
            eventSeatId: event_seat_id,
            paymentId: payment_id,
            categoryLabel: category_label,
            seatLabel: seat_label,
            unitPrice: unit_price,
          },
        }
      );
      return {
        ticket_id: row.out_ticket_id,
        ticket_qr_id: row.out_ticket_qr_id,
        token: row.out_token,
        reissued: row.out_reissued,
      };
    } catch (error) {
      if(process.env.DEBUG === "true"){
        console.log(error)
      }
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