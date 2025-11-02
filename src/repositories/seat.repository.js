import { Sequelize } from "sequelize";
import Seat from "../model_db/seat.js";


export default class SeatRepository {
  constructor(model = Seat) {
    this.model = model;
  }

  /**
   * @param {{ seat_no: string, row_no: string, section_id: number }} data
   * @param {{transaction?: import('sequelize').Transaction}} [options]
   * @returns {Promise<number>} seat_id
   */
  async createSeat(data, { transaction } = {}) {
    const { seat_no, row_no, section_id } = data || {};
    if (!seat_no) throw new Error("seat_no is required.");
    if (!row_no) throw new Error("row_no is required.");
    if (!section_id) throw new Error("section_id is required.");

    try {
      const rec = await this.model.create(
        { seat_no, row_no, section_id },
        { transaction }
      );
      return rec.seat_id;
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
   * @param {Array<{ seat_no: string, row_no: string, section_id: number }>} items
   * @param {{transaction?: import('sequelize').Transaction, validate?: boolean}} [options]
   * @returns {Promise<number>}
   */
  async bulkCreateSeats(items = [], { transaction, validate = true } = {}) {
    if (!Array.isArray(items) || items.length === 0) return 0;

    for (const [i, it] of items.entries()) {
      if (!it?.seat_no) throw new Error(`seat_no is required at index ${i}.`);
      if (!it?.row_no) throw new Error(`row_no is required at index ${i}.`);
      if (!it?.section_id) throw new Error(`section_id is required at index ${i}.`);
    }

    try {
      const recs = await this.model.bulkCreate(items, {
        transaction,
        validate, 
        returning: false,
      });
      return items.length;
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
