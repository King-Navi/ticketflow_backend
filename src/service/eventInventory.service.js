import EventRepository from "../repositories/event.repository.js";
import EventSeatRepository from "../repositories/eventSeat.repository.js";
import EventSeatStatusRepository from "../repositories/eventSeatStatus.repository.js";
import SeatRepository from "../repositories/seat.repository.js";
const eventRepo = new EventRepository();
const eventSeatRepo = new EventSeatRepository(); // <-- para escribir event_seat
const statusRepo = new EventSeatStatusRepository();
const seatRepo = new SeatRepository();



/**
 * Create an Event and its seat inventory (event_seat) atomically.
 *
 * Expected payload shape:
 * {
 *   event: {
 *     event_name: string,
 *     category: string,
 *     description: string,
 *     event_date: "YYYY-MM-DD",
 *     start_time: "HH:mm:ss",
 *     end_time?: "HH:mm:ss" | null,
 *     company_id: number,
 *     event_location_id: number
 *   },
 *   inventory: [
 *     { seat_id: number, base_price: number, status?: "available"|"reserved"|"blocked"|"sold", category_label?: string }
 *   ]
 * }
 *
 * @param {{ event: object, inventory: Array<object> }} payload
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<{
 *   event_id: number,
 *   event_location_id: number,
 *   inventory_created: Array<{ event_seat_id:number, seat_id:number, base_price:number, status:string }>,
 *   counts: { requested: number, created: number }
 * }>}
 */
export async function createEventWithInventoryService(payload, { transaction: externalTx } = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload is required.");
  }
  const { event, inventory } = payload;
  if (!event || typeof event !== "object") throw new Error("'event' is required.");
  if (!Array.isArray(inventory) || inventory.length === 0) {
    throw new Error("'inventory' must be a non-empty array.");
  }
  const normalizedInventory = inventory.map((it, i) => {
    if (!it || typeof it !== "object") {
      throw new Error(`Invalid inventory item at index ${i}.`);
    }
    const seat_id = Number(it.seat_id);
    if (!Number.isInteger(seat_id) || seat_id <= 0) {
      throw new Error(`'seat_id' must be a positive integer at index ${i}.`);
    }
    const base_price_num = Number(it.base_price);
    if (!Number.isFinite(base_price_num)) {
      throw new Error(`'base_price' must be numeric at index ${i}.`);
    }
    const status = (it.status ?? "available").trim().toLowerCase();
    return { seat_id, base_price: base_price_num, status };
  });

  const uniqueStatuses = Array.from(new Set(normalizedInventory.map(x => x.status)));
  const sequelize =
    (eventRepo.model && eventRepo.model.sequelize) ||
    (eventSeatRepo.model && eventSeatRepo.model.sequelize) ||
    (seatRepo.model && seatRepo.model.sequelize);

  if (!sequelize && !externalTx) {
    throw new Error("Sequelize instance not available and no external transaction provided.");
  }

  const resolveStatusIds = async (statuses) => {
    const map = new Map();
    for (const name of statuses) {
      const row = await statusRepo.findByName(name);
      if (!row) throw new Error(`Invalid seat status: '${name}'.`);
      map.set(name, row.event_seat_status_id);
    }
    return map;
  };

  const run = async (t) => {
    const seatIds = normalizedInventory.map(x => x.seat_id);
    const validSeatIds = await seatRepo.findValidSeatIdsForEventLocation(
      Number(event.event_location_id),
      seatIds,
      { transaction: t }
    );

    if (validSeatIds.length !== seatIds.length) {
      const validSet = new Set(validSeatIds);
      const invalid = seatIds.filter(id => !validSet.has(id));
      throw new Error(
        `Some seats do not belong to event_location_id ${event.event_location_id}: [${invalid.join(", ")}]`
      );
    }

    const conflict = await eventRepo.findOverlappingEvent({
      event_location_id: Number(event.event_location_id),
      event_date: event.event_date,// 'YYYY-MM-DD'
      start_time: event.start_time,// 'HH:mm:ss'
      end_time: event.end_time ?? null,// 'HH:mm:ss' | null
    });

    if (conflict) {
      const err = new Error("This location is already booked for that time range.");
      err.code = "EVENT_TIME_CONFLICT";
      err.statusCode = 409;
      throw err;
    }


    const event_id = await eventRepo.createEvent(event, { transaction: t });
    const statusMap = await resolveStatusIds(uniqueStatuses);
    const created = [];
    for (const item of normalizedInventory) {
      const event_seat_status_id = statusMap.get(item.status);
      const event_seat_id = await eventSeatRepo.createEventSeat(
        {
          event_id,
          seat_id: item.seat_id,
          base_price: item.base_price,
          event_seat_status_id,
        },
        { transaction: t }
      );
      created.push({
        event_seat_id,
        seat_id: item.seat_id,
        base_price: item.base_price,
        status: item.status,
      });
    }

    return {
      event_id,
      event_location_id: Number(event.event_location_id),
      inventory_created: created,
      counts: { requested: normalizedInventory.length, created: created.length },
    };
  };

  if (externalTx) {
    return run(externalTx);
  }

  return sequelize.transaction(async (t) => run(t));
}