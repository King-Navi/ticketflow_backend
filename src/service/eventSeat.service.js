import EventRepository from "../repositories/event.repository.js";
import EventSeatRepository from "../repositories/eventSeat.repository.js";
import { BadRequest, NotFound } from "../utils/errors/error.400.js";

const eventRepo = new EventRepository();
const eventSeatRepo = new EventSeatRepository();

/**
 * Get all event_seats for a given event_id.
 *
 * @param {number} event_id
 * @param {object} [options]
 * @param {import("sequelize").Transaction} [options.transaction]
 * @returns {Promise<{event_id:number, count:number, seats:object[]}>}
 */
export async function getEventSeatsByEventIdService(
  event_id,
  { transaction } = {}
) {
  if (!event_id) {
    throw new BadRequest("event_id is required.");
  }

  const event = await eventRepo.findById(event_id);
  if (!event) {
    throw new NotFound("Event not found.");
  }

  const seats = await eventSeatRepo.findAllByEventId(event_id, { transaction });

  return {
    event_id: Number(event_id),
    count: seats.length,
    seats,
  };
}
