import { Sequelize } from "sequelize";
import Section from "../model_db/section.js";


export default class SectionRepository {
  constructor(model = Section) {
    this.model = model;
  }

  /**
   * @param {{ section_name: string, event_location_id: number }} data
   * @param {{transaction?: import('sequelize').Transaction}} [options]
   * @returns {Promise<number>} section_id
   */
  async createSection(data, { transaction } = {}) {
    const { section_name, event_location_id } = data || {};
    if (!section_name) throw new Error("section_name is required.");
    if (!event_location_id) throw new Error("event_location_id is required.");

    try {
      const rec = await this.model.create(
        { section_name, event_location_id },
        { transaction }
      );
      return rec.section_id;
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

  async findById(sectionId) {
    try {
      return await this.model.findByPk(sectionId);
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
