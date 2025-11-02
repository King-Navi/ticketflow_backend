import { Sequelize } from "sequelize";
import EventLocation from "../model_db/event_location.js";

export default class EventLocationRepository {
  constructor(model = EventLocation) {
    this.model = model;
  }


  async findByEventLocationId(eventLocationId) {
    try {
      return await this.model.findByPk(eventLocationId);
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


  async search({ city, venueName, limit = 20, offset = 0 } = {}) {
    try {
      const where = {};
      if (city) where.city = city;
      if (venueName) where.venue_name = venueName;

      return await this.model.findAll({
        where,
        limit,
        offset,
        order: [["event_location_id", "DESC"]],
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

  /**
   * Crea un EventLocation.
   * @param {{
   *  venue_name: string,
   *  address_line1: string,
   *  address_line2?: string|null,
   *  city: string,
   *  state?: string|null,
   *  country: string,
   *  postal_code?: string|null,
   *  capacity?: number|null
   * }} data
   * @param {{transaction?: import('sequelize').Transaction}} [options]
   * @returns {Promise<number>} event_location_id
   */
  async createEventLocation(data, { transaction } = {}) {
    const {
      venue_name,
      address_line1,
      address_line2 = null,
      city,
      state = null,
      country,
      postal_code = null,
      capacity = null,
    } = data || {};

    if (!venue_name) throw new Error("venue_name is required.");
    if (!address_line1) throw new Error("address_line1 is required.");
    if (!city) throw new Error("city is required.");
    if (!country) throw new Error("country is required.");

    try {
      const rec = await this.model.create(
        {
          venue_name,
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,
          capacity,
        },
        { transaction }
      );
      return rec.event_location_id;
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
