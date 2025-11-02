import { Sequelize } from "sequelize";
import Event from "../model_db/event.js";


export default class EventRepository {
  constructor(eventModel = Event) {
    this.model = eventModel;
  }


  async findById(eventId) {
    return this.model.findByPk(eventId);
  }

  /**
   * 
   * @param {Object} data
   * @param {string} data.event_name
   * @param {string} data.category
   * @param {string} data.description
   * @param {string|Date} data.event_date
   * @param {string} data.start_time 'HH:MM:SS'
   * @param {string|null} data.end_time 'HH:MM:SS' | null
   * @param {number} data.company_id
   * @param {number} data.event_location_id
   * @param {object} [options]
   * @param {import('sequelize').Transaction} [options.transaction]
   * @returns {Promise<number>} event_id
   */
  async createEvent(
    {
      event_name,
      category,
      description,
      event_date,
      start_time,
      end_time = null,
      company_id,
      event_location_id,
    },
    { transaction } = {}
  ) {
    if (!event_name) throw new Error("event_name is required.");
    if (!category) throw new Error("category is required.");
    if (!description) throw new Error("description is required.");
    if (!event_date) throw new Error("event_date is required.");
    if (!start_time) throw new Error("start_time is required.");
    if (!company_id) throw new Error("company_id is required.");
    if (!event_location_id) throw new Error("event_location_id is required.");
    if (end_time && !(end_time > start_time)) {
      throw new Error("end_time must be greater than start_time.");
    }

    try {
      const ev = await this.model.create(
        {
          event_name,
          category,
          description,
          event_date,
          start_time,
          end_time,
          company_id,
          event_location_id,
        },
        { transaction }
      );
      return ev.event_id;
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
