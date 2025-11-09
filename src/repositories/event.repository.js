import { Sequelize } from "sequelize";
import Event from "../model_db/event.js";
import { EVENT_STATUS, EVENT_STATUS_CODE } from "../model_db/utils/eventStatus.js"

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
   * @param {number} data.event_status_id
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
      event_status_id = EVENT_STATUS.DRAFT,
    },
    { transaction } = {}
  ) {
    const finalEventStatusId =
      typeof event_status_id === "number"
        ? event_status_id
        : EVENT_STATUS_CODE[String(event_status_id).toLowerCase()] ?? EVENT_STATUS.DRAFT;
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
          event_status_id: finalEventStatusId,
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
      status,
      name,
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

    if (name && String(name).trim() !== "") {
      const pattern = `%${String(name).trim().replace(/[\\%_]/g, s => `\\${s}`)}%`;
      where.event_name = { [Op.iLike]: pattern };
    }

    if (status != null) {
      const toId = (raw) => {
        const s = String(raw).trim();
        if (/^\d+$/.test(s)) {
          return Number(s);
        }
        const mapped = EVENT_STATUS_CODE[s.toLowerCase()];
        return mapped ?? null;
      };

      if (Array.isArray(status)) {
        const ids = status
          .map(toId)
          .filter((x) => x !== null);
        if (ids.length > 0) {
          where.event_status_id = { [Op.in]: ids };
        } else {
          where.event_status_id = -1;
        }
      } else {
        const id = toId(status);
        if (id !== null) {
          where.event_status_id = id;
        } else {
          where.event_status_id = -1;
        }
      }
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

    return this.model.findAndCountAll({
      where,
      include: includeForFull,
      limit,
      offset,
      order,
      transaction
    });
  }


  async searchOneFilter({
    name,
    date,
    category,
    status,
    include,
    limit = 50,
    offset = 0,
    order = [["event_date", "ASC"], ["start_time", "ASC"]],
    transaction
  } = {}) {
    const provided = [
      name != null && String(name).trim() !== "",
      date != null && String(date).trim() !== "",
      category != null && String(category).trim() !== "",
      status != null && String(status).trim() !== ""
    ].filter(Boolean).length;

    if (provided !== 1) {
      throw new Error("Exactly one of 'name', 'date', 'category' or 'status' must be provided.");
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

    if (status && String(status).trim() !== "") {
      let eventStatusId = null;
      const raw = String(status).trim();

      if (/^\d+$/.test(raw)) {
        eventStatusId = Number(raw);
      } else {
        const normalized = raw.toLowerCase();
        eventStatusId = EVENT_STATUS_CODE[normalized];
      }

      if (!eventStatusId) {
        const err = new Error("Invalid event status filter.");
        err.code = "INVALID_EVENT_STATUS";
        err.statusCode = 400;
        throw err;
      }

      where.event_status_id = eventStatusId;
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

  /**
   * Check if there is any time overlap at the same location on the same date.
   *
   * @param {object} data
   * @param {number} data.event_location_id
   * @param {string|Date} data.event_date        // 'YYYY-MM-DD' o Date
   * @param {string} data.start_time             // 'HH:MM:SS'
   * @param {string|null} data.end_time          // 'HH:MM:SS' | null
   * @returns {Promise<object|null>} first conflicting event or null
   */
  async findOverlappingEvent({
    event_location_id,
    event_date,
    start_time,
    end_time,
  }) {
    const requestedEnd = end_time ?? start_time;

    try {
      const conflict = await this.model.findOne({
        where: {
          event_location_id,
          event_date,
          [Op.and]: [
            Sequelize.where(
              Sequelize.col("start_time"),
              { [Op.lt]: requestedEnd }
            ),
            Sequelize.where(
              Sequelize.fn(
                "COALESCE",
                Sequelize.col("end_time"),
                Sequelize.col("start_time")
              ),
              { [Op.gt]: start_time }
            ),
          ],
        },
        order: [["start_time", "ASC"]],
      });

      return conflict;
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
 * Update an existing event by its ID, with collision (overlap) check.
 *
 * Allows partial updates (PATCH style). Only provided fields are changed.
 * Also prevents overlapping schedule in the same location and date.
 *
 * @param {number} eventId
 * @param {object} data
 * @param {string} [data.event_name]
 * @param {string} [data.category]
 * @param {string} [data.description]
 * @param {string|Date} [data.event_date]         // 'YYYY-MM-DD' or Date
 * @param {string} [data.start_time]              // 'HH:MM:SS'
 * @param {string|null} [data.end_time]           // 'HH:MM:SS' | null
 * @param {number} [data.company_id]
 * @param {number} [data.event_location_id]
 *
 * @param {object} [options]
 * @param {import('sequelize').Transaction} [options.transaction]
 *
 * @returns {Promise<object>} updated event (plain object)
 *
 * @throws {Error} if event not found, invalid data, or overlapping conflict
 */
  async updateEventById(eventId, data = {}, { transaction } = {}) {
    try {
      if (!eventId) {
        throw new Error("eventId is required.");
      }
      const current = await this.model.findByPk(eventId, { transaction });
      if (!current) {
        throw new Error("Event not found.");
      }

      const updates = {};

      if (Object.prototype.hasOwnProperty.call(data, "event_name")) {
        if (!data.event_name) {
          throw new Error("event_name cannot be empty.");
        }
        updates.event_name = data.event_name;
      }

      if (Object.prototype.hasOwnProperty.call(data, "category")) {
        if (!data.category) {
          throw new Error("category cannot be empty.");
        }
        updates.category = data.category;
      }

      if (Object.prototype.hasOwnProperty.call(data, "description")) {
        if (!data.description) {
          throw new Error("description cannot be empty.");
        }
        updates.description = data.description;
      }

      if (Object.prototype.hasOwnProperty.call(data, "event_date")) {
        if (!data.event_date) {
          throw new Error("event_date cannot be empty.");
        }
        updates.event_date = data.event_date;
      }

      if (Object.prototype.hasOwnProperty.call(data, "start_time")) {
        if (!data.start_time) {
          throw new Error("start_time cannot be empty.");
        }
        updates.start_time = data.start_time;
      }

      if (Object.prototype.hasOwnProperty.call(data, "end_time")) {
        updates.end_time = data.end_time ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(data, "company_id")) {
        updates.company_id = data.company_id;
      }

      if (Object.prototype.hasOwnProperty.call(data, "event_location_id")) {
        updates.event_location_id = data.event_location_id;
      }

      const final_event_date =
        updates.event_date !== undefined ? updates.event_date : current.event_date;

      const final_start_time =
        updates.start_time !== undefined ? updates.start_time : current.start_time;

      const final_end_time =
        updates.end_time !== undefined
          ? updates.end_time
          : (current.end_time ?? null);

      const final_event_location_id =
        updates.event_location_id !== undefined
          ? updates.event_location_id
          : current.event_location_id;

      if (final_end_time != null) {
        if (!(final_end_time > final_start_time)) {
          throw new Error("end_time must be greater than start_time.");
        }
      }

      const scheduleFieldsTouched =
        Object.prototype.hasOwnProperty.call(updates, "event_date") ||
        Object.prototype.hasOwnProperty.call(updates, "start_time") ||
        Object.prototype.hasOwnProperty.call(updates, "end_time") ||
        Object.prototype.hasOwnProperty.call(updates, "event_location_id");

      if (scheduleFieldsTouched) {
        const requestedEnd = final_end_time ?? final_start_time;

        const conflict = await this.model.findOne({
          where: {
            event_location_id: final_event_location_id,
            event_date: final_event_date,
            event_id: { [Op.ne]: eventId },
            [Op.and]: [
              Sequelize.where(
                Sequelize.col("start_time"),
                { [Op.lt]: requestedEnd }
              ),
              Sequelize.where(
                Sequelize.fn(
                  "COALESCE",
                  Sequelize.col("end_time"),
                  Sequelize.col("start_time")
                ),
                { [Op.gt]: final_start_time }
              ),
            ],
          },
          order: [["start_time", "ASC"]],
          transaction
        });

        if (conflict) {
          const err = new Error("This location is already booked for that time range.");
          err.code = "EVENT_TIME_CONFLICT";
          err.statusCode = 409;
          throw err;
        }
      }

      if (Object.keys(updates).length === 0) {
        return current.get({ plain: true });
      }

      const [count, rows] = await this.model.update(
        {
          ...updates,
          updatedAt: new Date(),
        },
        {
          where: { event_id: eventId },
          returning: true,
          transaction,
        }
      );

      if (count === 0 || !rows || !rows[0]) {
        throw new Error("Event not found.");
      }

      return rows[0].get({ plain: true });
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
   * Ensure that an event exists and its status is in the allowed list.
   *
   * @param {number} eventId
   * @param {number[]} allowedStatusIds
   * @param {object} [options]
   * @param {import('sequelize').Transaction} [options.transaction]
   * @returns {Promise<object>} the event plain object
   * @throws {Error} if event does not exist or status is not allowed
   */
  async ensureEventInStatuses(eventId, allowedStatusIds = [], { transaction } = {}) {
    if (!eventId) {
      throw new Error("eventId is required.");
    }
    if (!Array.isArray(allowedStatusIds) || allowedStatusIds.length === 0) {
      throw new Error("allowedStatusIds must be a non-empty array.");
    }

    try {
      const event = await this.model.findByPk(eventId, { transaction });

      if (!event) {
        const err = new Error("Event not found.");
        err.code = "EVENT_NOT_FOUND";
        err.statusCode = 404;
        throw err;
      }

      const currentStatusId = event.event_status_id;

      if (!allowedStatusIds.includes(currentStatusId)) {
        const err = new Error("Event status is not allowed for this operation.");
        err.code = "EVENT_STATUS_NOT_ALLOWED";
        err.statusCode = 409;
        err.meta = {
          eventId,
          currentStatusId,
          allowedStatusIds,
        };
        throw err;
      }

      return event.get({ plain: true });
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
   * Ensure the event is ON SALE.
   *
   * @param {number} eventId
   * @param {object} [options]
   * @param {import('sequelize').Transaction} [options.transaction]
   * @returns {Promise<object>} event plain object
   */
  async ensureEventIsOnSale(eventId, { transaction } = {}) {
    return this.ensureEventInStatuses(
      eventId,
      [EVENT_STATUS.ON_SALE],
      { transaction }
    );
  }

  /**
   * Ensure the event is editable (draft or edit_lock).
   *
   * @param {number} eventId
   * @param {object} [options]
   * @param {import('sequelize').Transaction} [options.transaction]
   */
  async ensureEventIsEditable(eventId, { transaction } = {}) {
    return this.ensureEventInStatuses(
      eventId,
      [EVENT_STATUS.DRAFT, EVENT_STATUS.EDIT_LOCK],
      { transaction }
    );
  }

  /**
  * Update only the status of an event.
  *
  * @param {number} eventId
  * @param {number} newStatusId
  * @param {object} [options]
  * @param {import('sequelize').Transaction} [options.transaction]
  * @returns {Promise<object>} updated event (plain)
  */
  async updateEventStatus(eventId, newStatusId, { transaction } = {}) {
    if (!eventId) {
      throw new Error("eventId is required.");
    }
    if (!newStatusId) {
      throw new Error("newStatusId is required.");
    }

    const validStatusIds = Object.values(EVENT_STATUS);
    if (!validStatusIds.includes(newStatusId)) {
      const err = new Error("Invalid event status id.");
      err.code = "INVALID_EVENT_STATUS";
      err.statusCode = 400;
      throw err;
    }

    try {
      const event = await this.model.findByPk(eventId, { transaction });
      if (!event) {
        const err = new Error("Event not found.");
        err.code = "EVENT_NOT_FOUND";
        err.statusCode = 404;
        throw err;
      }
      event.event_status_id = newStatusId;
      event.updated_at = new Date();

      await event.save({ transaction });

      return event.get({ plain: true });
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

  async setEventOnSale(eventId, { transaction } = {}) {
    return this.updateEventStatus(eventId, EVENT_STATUS.ON_SALE, { transaction });
  }

  async setEventPaused(eventId, { transaction } = {}) {
    return this.updateEventStatus(eventId, EVENT_STATUS.PAUSED, { transaction });
  }

  async setEventClosed(eventId, { transaction } = {}) {
    return this.updateEventStatus(eventId, EVENT_STATUS.CLOSED, { transaction });
  }

  async cancelEvent(eventId, { transaction } = {}) {
    return this.updateEventStatus(eventId, EVENT_STATUS.CANCELED, { transaction });
  }
}
