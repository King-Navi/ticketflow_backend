import { Sequelize } from "sequelize";
import EventImage from "../model_db/event_image.js";

export default class EventImageRepository {
  constructor(model = EventImage) {
    this.model = model;
  }

  /**
   * Create event image record
   * @param {{
   *  event_id: number,
   *  event_image_type_id: number,
   *  image_path: string,
   *  alt_text?: string|null,
   *  sort_order?: number|null
   * }} data
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<number>} event_image_id
   */
  async create(data, { transaction } = {}) {
    const {
      event_id,
      event_image_type_id,
      image_path,
      alt_text = null,
      sort_order = null,
    } = data || {};

    if (!event_id) throw new Error("event_id is required.");
    if (!event_image_type_id) throw new Error("event_image_type_id is required.");
    if (!image_path) throw new Error("image_path is required.");

    try {
      const rec = await this.model.create(
        {
          event_id,
          event_image_type_id,
          image_path,
          alt_text,
          sort_order,
        },
        { transaction }
      );
      return rec.event_image_id;
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
   * Get all images for an event
   * @param {number} eventId
   * @returns {Promise<Array<object>>}
   */
  async findAllByEventId(eventId) {
    if (!eventId) throw new Error("eventId is required.");

    try {
      return await this.model.findAll({
        where: { event_id: eventId },
        order: [
          ["sort_order", "ASC"],
          ["event_image_id", "ASC"],
        ],
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
