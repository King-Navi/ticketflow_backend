import { Sequelize } from "sequelize";
import EventSeatStatusModel from "../model_db/event_seat_status.js";

export default class EventSeatStatusRepository {
  constructor({ EventSeatStatus = EventSeatStatusModel } = {}) {
    this.model = EventSeatStatus;
  }

  /**
   * Get status row by its status_name (e.g. "available", "reserved", "sold")
   *
   * @param {string} statusName
   * @returns {Promise<{event_seat_status_id:number,status_name:string}|null>}
   */
  async findByName(statusName) {
    if (!statusName) {
      throw new Error("statusName is required.");
    }

    try {
      return await this.model.findOne({
        where: { status_name: statusName },
        attributes: ["event_seat_status_id", "status_name", "created_at", "updated_at"],
      });
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
