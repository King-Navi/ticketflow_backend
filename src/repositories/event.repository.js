import { Sequelize } from "sequelize";
import Event from "../model_db/event.js";

// LIKE/ILIKE Postgres
function escapeLike(raw = "") {
  return String(raw).replace(/[\\%_]/g, s => `\\${s}`);
}

const { Op } = Sequelize;

export default class EventRepository {
  constructor(eventModel = Event) {
    this.model = eventModel;
  }


  async findById(eventId) {
    try {
      return this.model.findByPk(eventId);
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

  /**
  * Get all events for a company.
  *
  * @param {number} companyId
  * @param {object} [options]
  * @param {boolean} [options.full=false] include associations if true
  * @param {import('sequelize').Includeable[]} [options.include] custom include
  * @param {number} [options.limit=50]
  * @param {number} [options.offset=0]
  * @param {Array}  [options.order=[["event_date","ASC"],["start_time","ASC"]]]
  * @param {string|Date} [options.dateFrom] filter by event_date >= dateFrom
  * @param {string|Date} [options.dateTo]   filter by event_date <= dateTo
  * @param {string|string[]} [options.category] filter by category (single or array)
  * @param {import('sequelize').Transaction} [options.transaction]
  * @returns {Promise<{rows: Event[], count: number}>}
  */
  async findAllByCompanyId(
    companyId,
    {
      full = false,
      include,
      limit = 50,
      offset = 0,
      order = [["event_date", "ASC"], ["start_time", "ASC"]],
      dateFrom,
      dateTo,
      category,
      transaction
    } = {}
  ) {
    if (companyId == null) throw new Error("companyId is required.");

    const where = { company_id: companyId };

    if (dateFrom && dateTo) where.event_date = { [Op.between]: [dateFrom, dateTo] };
    else if (dateFrom) where.event_date = { [Op.gte]: dateFrom };
    else if (dateTo) where.event_date = { [Op.lte]: dateTo };

    if (category) {
      where.category = Array.isArray(category) ? { [Op.in]: category } : category;
    }

    const includeForFull =
      include ??
      (full
        ? [
          { model: Company, as: "company", attributes: ["company_id", "company_name", "tax_id"] },
          { model: EventLocation, as: "location", attributes: ["event_location_id", "name", "address"] },
          {
            model: Ticket,
            as: "tickets",
            attributes: ["ticket_id", "price", "currency", "status"],
            separate: true,
            order: [["price", "ASC"]]
          }
        ]
        : undefined);

    try {
      return await this.model.findAndCountAll({
        where,
        include: includeForFull,
        limit,
        offset,
        order,
        transaction
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


  async searchOneFilter({
    name,
    date,
    category,
    include,
    limit = 50,
    offset = 0,
    order = [["event_date", "ASC"], ["start_time", "ASC"]],
    transaction
  } = {}) {
    const provided = [
      name != null && String(name).trim() !== "",
      date != null && String(date).trim() !== "",
      category != null && String(category).trim() !== ""
    ].filter(Boolean).length;

    if (provided !== 1) {
      throw new Error("Exactly one of 'name', 'date' or 'category' must be provided.");
    }

    const where = {};

    if (name && String(name).trim() !== "") {
      const pattern = `%${escapeLike(String(name).trim())}%`;
      where.event_name = { [Op.iLike]: pattern };
    }

    if (date && String(date).trim() !== "") {
      const d = date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
      where.event_date = d;
    }

    if (category && String(category).trim() !== "") {
      where.category = String(category).trim();
    }

    return this.model.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order,
      transaction,
      distinct: Boolean(include)
    });
  }
  async findByName(name, opts = {}) {
    if (!name || !String(name).trim()) throw new Error("name is required.");
    return this.searchOneFilter({ ...opts, name, date: undefined, category: undefined });
  }

  async findByDate(date, opts = {}) {
    if (!date || !String(date).trim?.()) throw new Error("date is required.");
    return this.searchOneFilter({ ...opts, name: undefined, date, category: undefined });
  }

  async findByCategory(category, opts = {}) {
    if (!category || !String(category).trim()) throw new Error("category is required.");
    return this.searchOneFilter({ ...opts, name: undefined, date: undefined, category });
  }
}
