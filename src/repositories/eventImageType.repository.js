import { Sequelize } from "sequelize";
import EventImageType from "../model_db/event_image_type.js";

export default class EventImageTypeRepository {
  constructor(model = EventImageType) {
    this.model = model;
  }

  /**
   * Find image type by code (e.g. 'cover', 'banner', 'gallery')
   * @param {string} code
   * @returns {Promise<object|null>}
   */
  async findByCode(code) {
    if (!code) throw new Error("code is required.");

    try {
      return await this.model.findOne({
        where: { code },
        attributes: ["event_image_type_id", "code", "description"],
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
