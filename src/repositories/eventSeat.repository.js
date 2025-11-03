import { Sequelize } from "sequelize";
import EventSeatModel from "../model_db/event_seat.js";

export default class EventSeatRepository {
  constructor({ EventSeat = EventSeatModel } = {}) {
    this.model = EventSeat;
  }

  /**
   * Insert one row into event_seat
   *
   * @param {object} data
   * @param {number} data.event_id
   * @param {number} data.seat_id
   * @param {number} data.base_price
   * @param {number} data.event_seat_status_id
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<number>} event_seat_id
   */
  async createEventSeat(data, { transaction } = {}) {
    const {
      event_id,
      seat_id,
      base_price,
      event_seat_status_id,
    } = data || {};

    if (!event_id) throw new Error("event_id is required.");
    if (!seat_id) throw new Error("seat_id is required.");
    if (base_price === undefined || base_price === null) {
      throw new Error("base_price is required.");
    }
    if (!event_seat_status_id) {
      throw new Error("event_seat_status_id is required.");
    }

    try {
      const rec = await this.model.create(
        {
          event_id,
          seat_id,
          base_price,
          event_seat_status_id,
        },
        { transaction }
      );
      return rec.event_seat_id;
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
   * Bulk insert inventory for a given event.
   * Each item looks like:
   * {
   *    seat_id: number,
   *    base_price: number,
   *    event_seat_status_id: number
   * }
   *
   * @param {number} event_id
   * @param {Array<{seat_id:number, base_price:number, event_seat_status_id:number}>} items
   * @param {{transaction?: import("sequelize").Transaction, validate?: boolean}} [options]
   * @returns {Promise<number>} how many rows attempted to insert
   */
  async bulkCreateEventSeats(
    event_id,
    items = [],
    { transaction, validate = true } = {}
  ) {
    if (!event_id) throw new Error("event_id is required.");
    if (!Array.isArray(items) || items.length === 0) return 0;

    for (const [i, it] of items.entries()) {
      if (!it?.seat_id) {
        throw new Error(`seat_id is required at inventory index ${i}.`);
      }
      if (it.base_price === undefined || it.base_price === null) {
        throw new Error(`base_price is required at inventory index ${i}.`);
      }
      if (!it?.event_seat_status_id) {
        throw new Error(
          `event_seat_status_id is required at inventory index ${i}.`
        );
      }
    }

    const rows = items.map((it) => ({
      event_id,
      seat_id: it.seat_id,
      base_price: it.base_price,
      event_seat_status_id: it.event_seat_status_id,
    }));

    try {
      await this.model.bulkCreate(rows, {
        transaction,
        validate,
        returning: false,
      });
      return rows.length;
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
