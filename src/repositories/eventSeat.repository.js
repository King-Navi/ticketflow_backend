import { Sequelize } from "sequelize";
import EventSeatModel from "../model_db/event_seat.js";
import { BadRequest, Conflict, NotFound } from "../utils/errors/error.400.js";

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


  async findById(eventSeatId, { transaction } = {}) {
    if (!eventSeatId) {
      throw new Error("eventSeatId is required.");
    }
    try {
      return await this.model.findByPk(eventSeatId, { transaction });
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
 * @typedef {number|string} IdLike
 * Identificador aceptado como número o cadena numérica.
 */

  /**
   * @typedef {object} EnsureOptions
   * @property {import("sequelize").Transaction} [transaction]
   *   Transacción de Sequelize opcional para ejecutar la consulta de forma atómica.
   */

  /**
   * Verifica que el `event_seat_id` pertenezca al `event_id` indicado.
   *
   * - Si el asiento no existe, lanza `NotFound`.
   * - Si existe pero su `event_id` no coincide, lanza `Conflict` e incluye `meta`
   *   con `expected_event_id`, `actual_event_id` y `event_seat_id`.
   * - Errores de conectividad o del motor de base de datos se normalizan a `Error`
   *   con mensajes claros.
   *
   * @async
   * @param {IdLike} eventId
   *   ID del evento al que debe pertenecer el asiento.
   * @param {IdLike} eventSeatId
   *   ID del asiento de evento que se desea validar.
   * @param {EnsureOptions} [options={}]
   *   Opciones de la operación.
   * @returns {Promise<Record<string, any>>}
   *   Objeto plano del registro `event_seat` (resultado de `model#get({ plain: true })`).
   *
   * @throws {BadRequest}
   *   Si `eventId` o `eventSeatId` no fueron provistos.
   * @throws {NotFound}
   *   Si el asiento de evento no existe.
   * @throws {Conflict}
   *   Si el asiento existe pero no pertenece al evento proporcionado. Incluye `error.meta`.
   * @throws {Error}
   *   Si ocurre un error de conexión (`Sequelize.ConnectionError`) o un error de base de datos
   *   (`Sequelize.DatabaseError`).
   *
   * @example
   * // Dentro de un servicio/DAO que tiene this.model apuntando al modelo de Sequelize:
   * const seat = await ensureEventSeatBelongsToEvent(42, 1234, { transaction });
   * console.log(seat.event_id); // 42
   */
  async ensureEventSeatBelongsToEvent(eventId, eventSeatId, { transaction } = {}) {
    if (!eventId) {
      throw new BadRequest("eventId is required.");
    }
    if (!eventSeatId) {
      throw new BadRequest("eventSeatId is required.");
    }

    try {
      const es = await this.model.findByPk(eventSeatId, { transaction });

      if (!es) {
        const err = new NotFound("Event seat not found.");
        throw err;
      }

      if (Number(es.event_id) !== Number(eventId)) {
        const err = new Conflict("Event seat does not belong to the provided event.");
        err.meta = {
          expected_event_id: eventId,
          actual_event_id: es.event_id,
          event_seat_id: eventSeatId,
        };
        throw err;
      }

      return es.get({ plain: true });
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
   * Update only the status of an event_seat.
   *
   * @param {number} eventSeatId
   * @param {number} newStatusId
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<object>} updated event_seat plain
   */
  async updateEventSeatStatus(eventSeatId, newStatusId, { transaction } = {}) {
    if (!eventSeatId) {
      throw new BadRequest("eventSeatId is required.");
    }
    if (!newStatusId) {
      throw new BadRequest("newStatusId is required.");
    }

    try {
      const es = await this.model.findByPk(eventSeatId, { transaction });
      if (!es) {
        throw new NotFound("Event seat not found.");
      }

      es.event_seat_status_id = newStatusId;
      es.updated_at = new Date();

      await es.save({ transaction });

      return es.get({ plain: true });
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
   * Get all event_seats for a given event_id
   *
   * @param {number} eventId
   * @param {{transaction?: import("sequelize").Transaction}} [options]
   * @returns {Promise<Array<object>>}
   */
  async findAllByEventId(eventId, { transaction } = {}) {
    if (!eventId) {
      throw new BadRequest("eventId is required.");
    }

    try {
      const rows = await this.model.findAll({
        where: { event_id: eventId },
        order: [["event_seat_id", "ASC"]],
        transaction,
      });

      return rows.map(r => r.get({ plain: true }));
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
