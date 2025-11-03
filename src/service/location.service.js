import SectionRepository from "../repositories/section.repository.js";
import SeatRepository from "../repositories/seat.repository.js";
import EventLocationRepository from "../repositories/eventLocation.repository.js";

const sectionRepo = new SectionRepository();
const eventLocationRepo = new EventLocationRepository();
const seatRepo = new SeatRepository();


/**
 * Create a new Event Location (venue).
 *
 * Business rules:
 * - Required: `venue_name`, `address_line1`, `city`, `country`.
 * - Optional: `address_line2`, `state`, `postal_code`, `capacity` (must be a non-negative integer if provided).
 * - No duplicates check is performed here; rely on DB constraints if you need uniqueness.
 *
 * @async
 * @function newEventLocationService
 * @param {Object} payload
 * @param {string} payload.venue_name - Venue display name (e.g., "Teatro Aurora").
 * @param {string} payload.address_line1 - Primary street address.
 * @param {string} [payload.address_line2=null] - Additional address line.
 * @param {string} payload.city - City name.
 * @param {string} [payload.state=null] - State or region.
 * @param {string} payload.country - ISO country or common name.
 * @param {string} [payload.postal_code=null] - Postal/ZIP code.
 * @param {number} [payload.capacity=null] - Total capacity; must be >= 0 if provided.
 * @returns {Promise<{event_location_id:number}>} The created venue id.
 * @throws {Error} If required fields are missing or DB errors occur.
 *
 * @example
 * const { event_location_id } = await newEventLocationService({
 *   venue_name: "Teatro Aurora",
 *   address_line1: "Av. Central 123",
 *   city: "CDMX",
 *   country: "MX",
 *   capacity: 1200
 * });
 */
export async function newEventLocationService(payload) {
  const {
    venue_name,
    address_line1,
    city,
    country,
    address_line2 = null,
    state = null,
    postal_code = null,
    capacity = null,
  } = payload ?? {};

  if (!venue_name) throw new Error("venue_name is required.");
  if (!address_line1) throw new Error("address_line1 is required.");
  if (!city) throw new Error("city is required.");
  if (!country) throw new Error("country is required.");
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) {
    throw new Error("capacity must be a non-negative integer if provided.");
  }

  const event_location_id = await eventLocationRepo.createEventLocation({
    venue_name,
    address_line1,
    address_line2,
    city,
    state,
    country,
    postal_code,
    capacity,
  });

  return { event_location_id };
}



/**
 * Create a Section for an existing Event Location.
 *
 * Business rules:
 * - Required: `section_name`, `event_location_id`.
 * - The referenced event location must exist (validated here).
 *
 * @async
 * @function newSectionService
 * @param {Object} payload
 * @param {string} payload.section_name - Human-friendly section name (e.g., "Platea A").
 * @param {number} payload.event_location_id - Existing event_location.primary key.
 * @returns {Promise<{section_id:number}>} The created section id.
 * @throws {Error} If required fields are missing or the event location does not exist.
 *
 * @example
 * const { section_id } = await newSectionService({
 *   section_name: "Platea A",
 *   event_location_id: 42
 * });
 */
export async function newSectionService(payload) {
  const { section_name, event_location_id } = payload ?? {};

  if (!section_name) throw new Error("section_name is required.");
  if (!event_location_id) throw new Error("event_location_id is required.");

  const venue = await eventLocationRepo.findByEventLocationId(event_location_id);
  if (!venue) throw new Error(`EventLocation ${event_location_id} does not exist.`);

  const section_id = await sectionRepo.createSection({
    section_name,
    event_location_id,
  });

  return { section_id };
}




/**
 * Create a Seat within a Section.
 *
 * Business rules:
 * - Required: `seat_no`, `row_no`, `section_id`.
 * - The referenced section must exist (validated here).
 * - If you enforce uniqueness at DB level (e.g., UNIQUE(section_id, row_no, seat_no)),
 *   duplicates will be rejected by Postgres.
 *
 * @async
 * @function newSeatService
 * @param {Object} payload
 * @param {string} payload.seat_no - Seat number/label (e.g., "12").
 * @param {string} payload.row_no - Row label (e.g., "B").
 * @param {number} payload.section_id - Existing section primary key.
 * @returns {Promise<{seat_id:number}>} The created seat id.
 * @throws {Error} If required fields are missing or the section does not exist.
 *
 * @example
 * const { seat_id } = await newSeatService({
 *   seat_no: "12",
 *   row_no: "B",
 *   section_id: 7
 * });
 */
export async function newSeatService(payload) {
  const { seat_no, row_no, section_id } = payload ?? {};

  if (!seat_no) throw new Error("seat_no is required.");
  if (!row_no) throw new Error("row_no is required.");
  if (!section_id) throw new Error("section_id is required.");

  const section = await sectionRepo.findById(section_id);
  if (!section) throw new Error(`Section ${section_id} does not exist.`);

  const seat_id = await seatRepo.createSeat({ seat_no, row_no, section_id });
  return { seat_id };
}



/**
 * Bulk-create Seats within a Section.
 *
 * Business rules:
 * - `section_id` must exist (validated here).
 * - Each item must include `seat_no` and `row_no`.
 * - No deduplication is performed here. If you have a UNIQUE index
 *   (e.g., UNIQUE(section_id, row_no, seat_no)), the DB will reject duplicates.
 *
 * @async
 * @function newSeatsBulkService
 * @param {number} section_id - Existing section primary key.
 * @param {Array<{seat_no:string,row_no:string}>} seats - Array of seat definitions.
 * @returns {Promise<{created:number}>} Number of seats created.
 * @throws {Error} If the section does not exist, array is empty, or items are malformed.
 *
 * @example
 * const { created } = await newSeatsBulkService(7, [
 *   { seat_no: "1", row_no: "A" },
 *   { seat_no: "2", row_no: "A" },
 *   { seat_no: "3", row_no: "A" },
 * ]);
 */
export async function newSeatsBulkService(section_id, seats) {
  if (!section_id) throw new Error("section_id is required.");
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new Error("seats must be a non-empty array.");
  }

  const section = await sectionRepo.findById(section_id);
  if (!section) throw new Error(`Section ${section_id} does not exist.`);

  const items = seats.map((s, idx) => {
    const seat_no = s?.seat_no;
    const row_no = s?.row_no;
    if (!seat_no) throw new Error(`seat_no is required at index ${idx}.`);
    if (!row_no) throw new Error(`row_no is required at index ${idx}.`);
    return { seat_no, row_no, section_id };
  });

  const createdCount = await seatRepo.bulkCreateSeats(items);
  return { created: createdCount };
}


export async function listAllLocationsService({ limit, offset } = {}) {
  return eventLocationRepo.findAllLocations({ limit, offset });
}