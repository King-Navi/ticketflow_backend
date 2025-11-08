import EventRepository from "../repositories/event.repository.js";
import CompanyRepository from "../repositories/company.repository.js";
import EventLocationRepository from "../repositories/eventLocation.repository.js";
import OrganizerRepository from "../repositories/organizer.repository.js";
import { ConflictError } from "./error/classes.js";
import { Unauthorized } from "../utils/errors/error.400.js";
import {EVENT_STATUS_CODE} from "..//model_db/utils/eventStatus.js"
const eventRepo = new EventRepository();
const companyRepo = new CompanyRepository();
const locationRepo = new EventLocationRepository();
const organizerRepo = new OrganizerRepository();



/**
 * Creates a new event after validating the company, location, and that the organizer
 * belongs to the specified company. All DB writes are wrapped in a Sequelize transaction.
 *
 * @async
 * @function newEventService
 * @param {NewEventPayload} payload
 * @property {string} event_name                - Human-readable event name (e.g., "JS Conf CDMX").
 * @property {EventCategory|string} category    - Event category.
 * @property {string} [description]             - Free-text or Markdown description.
 * @property {string|Date} event_date           - Event date (ISO 8601 string or Date).
 * @property {string} start_time                - Start time in HH:mm (24h) or ISO 8601.
 * @property {string} end_time                  - End time in HH:mm (24h) or ISO 8601.
 * @property {number|string} company_id         - Organizer company ID.
 * @property {number|string} event_location_id  - Event location ID.
 *   Object with the event details to be created.
 * @param {number|string} organizerCredentialId
 *   Credential identifier used to resolve the organizer.
 * @returns {Promise<number|string>}
 *   Resolves to the created event ID (type depends on repository/DB).
 *
 * @throws {Error} If the company does not exist.
 * @throws {Error} If the event location does not exist.
 * @throws {Error} If no organizer is found for the given credentials.
 * @throws {Error} If the organizer does not belong to the specified company.
 * @throws {Error} If the database transaction fails for any reason.
 *
 * @example
 * await newEventService(
 *   {
 *     event_name: "Node.js Meetup",
 *     category: "meetup",
 *     description: "Lightning talks + networking",
 *     event_date: "2025-11-15",
 *     start_time: "19:00",
 *     end_time: "21:00",
 *     company_id: 42,
 *     event_location_id: 7,
 *   },
 *   99 // organizerCredentialId
 * );
 */
export async function newEventService(payload, organizerCredentialId) {
  const {
    event_name,
    category,
    description,
    event_date,
    start_time,
    end_time,
    company_id,
    event_location_id,
  } = payload;
  const [company, location, organizer] = await Promise.all([
    companyRepo.findCompanyById(company_id),
    locationRepo.findByEventLocationId(event_location_id),
    organizerRepo.findOrganizerByCredentialId(organizerCredentialId),
  ]);

  if (!company) throw new Error(`Company ${company_id} does not exist.`);
  if (!location) throw new Error(`EventLocation ${event_location_id} does not exist.`);
  if (!organizer) throw new Error(`Organizer for this credential does not exist.`);
  if (organizer.company_id !== company_id) {
    throw new Unauthorized(`Organizer cannot create events for company ${company_id}.`);
  }

  const conflict = await eventRepo.findOverlappingEvent({
    event_location_id,
    event_date,
    start_time,
    end_time,
  });

  if (conflict) {
    throw new ConflictError(
      "This location is already booked for that time range.",
      {
        event_location_id,
        event_date,
        requested_start: start_time,
        requested_end: end_time ?? start_time,
      }
    );
  }

  const event_id = await eventRepo.createEvent({
    event_name,
    category,
    description,
    event_date,
    start_time,
    end_time,
    company_id,
    event_location_id,
  });
  return event_id;
}

/**
 * Updates an existing event.
 *
 * Reglas de negocio:
 * - Solo el organizer dueño (misma company) puede editar el evento.
 * - Si intenta cambiar company_id, solo puede poner su propia company.
 * - Si intenta cambiar event_location_id, esa location debe existir.
 * - Se valida solapamiento horario (overlap) si cambió fecha / hora / lugar.
 *
 * @param {number|string} eventId ID del evento a editar.
 * @param {object} payload Campos a actualizar (parcial, tipo PATCH).
 * @param {string} [payload.event_name]
 * @param {string} [payload.category]
 * @param {string} [payload.description]
 * @param {string|Date} [payload.event_date] 'YYYY-MM-DD' o Date.
 * @param {string} [payload.start_time] 'HH:MM:SS'
 * @param {string|null} [payload.end_time] 'HH:MM:SS' | null
 * @param {number} [payload.company_id]
 * @param {number} [payload.event_location_id]
 *
 * @param {number|string} organizerCredentialId  Credential del organizer autenticado.
 *
 * @returns {Promise<object>} Event actualizado (plain object).
 *
 * @throws {Error|ConflictError}
 *   - "Organizer for this credential does not exist."
 *   - "Event not found."
 *   - "Organizer cannot edit this event."
 *   - "Organizer cannot move this event to another company."
 *   - ConflictError (409) si hay traslape de horario/lugar.
 */
export async function editEventService(eventId, payload, organizerCredentialId) {
  const organizer = await organizerRepo.findOrganizerByCredentialId(organizerCredentialId);
  if (!organizer) {
    throw new Error("Organizer for this credential does not exist.");
  }

  const existingEvent = await eventRepo.findById(eventId);
  if (!existingEvent) {
    throw new Error("Event not found.");
  }

  if (organizer.company_id !== existingEvent.company_id) {
    throw new Error("Organizer cannot edit this event.");
  }

  if (Object.prototype.hasOwnProperty.call(payload, "company_id")) {
    const newCompanyId = payload.company_id;

    if (newCompanyId == null) {
      throw new Error("company_id cannot be null.");
    }

    if (Number(newCompanyId) !== Number(organizer.company_id)) {
      throw new Error("Organizer cannot move this event to another company.");
    }

    const company = await companyRepo.findCompanyById(newCompanyId);
    if (!company) {
      throw new Error(`Company ${newCompanyId} does not exist.`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "event_location_id")) {
    const newLocationId = payload.event_location_id;

    if (newLocationId == null) {
      throw new Error("event_location_id cannot be null.");
    }

    const location = await locationRepo.findByEventLocationId(newLocationId);
    if (!location) {
      throw new Error(`EventLocation ${newLocationId} does not exist.`);
    }
  }
  try {
    const updated = await eventRepo.updateEventById(eventId, payload);

    return updated;
  } catch (err) {
    if (err.code === "EVENT_TIME_CONFLICT") {
      const requested_start = payload.start_time ?? existingEvent.start_time;
      const requested_end =
        (payload.end_time ?? existingEvent.end_time) ?? requested_start;
      const final_event_location_id =
        payload.event_location_id ?? existingEvent.event_location_id;
      const final_event_date =
        payload.event_date ?? existingEvent.event_date;

      throw new ConflictError(
        "This location is already booked for that time range.",
        {
          event_location_id: final_event_location_id,
          event_date: final_event_date,
          requested_start,
          requested_end,
        }
      );
    }

    throw err;
  }
}

export async function searchCompanyEventsService({ name, date, category, ...rest } = {}) {
  const provided = [!!(name?.trim?.()), !!(date?.toString?.()), !!(category?.trim?.())].filter(Boolean).length;
  if (provided !== 1) {
    throw new Error("Exactly one of 'name', 'date' or 'category' must be provided.");
  }

  const opts = normalizeOptions(rest);
  return eventRepo.searchOneFilter({ name, date, category, ...opts });
}

function normalizeOptions(opts = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = "event_date",
    orderDir = "ASC",
    include
  } = opts;

  const dir = String(orderDir).toUpperCase() === "DESC" ? "DESC" : "ASC";
  const order = [[String(orderBy), dir]];
  if (String(orderBy) !== "start_time") order.push(["start_time", "ASC"]);

  return {
    limit: Number(limit),
    offset: Number(offset),
    order,
    include
  };
}


/**
 * Cambia el estado de un evento verificando que el organizer dueño
 * (mismo company_id) sea quien realiza la acción.
 *
 * @param {number|string} eventId
 * @param {number|string} newStatus  // puede ser id numérico o string ('on_sale', 'paused', etc.)
 * @param {number|string} organizerCredentialId
 * @returns {Promise<object>} evento actualizado (plain)
 *
 * @throws {Error}
 *  - "Organizer for this credential does not exist."
 *  - "Event not found."
 *  - Unauthorized si el organizer no pertenece a la compañía del evento.
 *  - "Invalid event status id." si el status es inválido (desde el repo).
 */
export async function updateEventStatusService(eventId, newStatus, organizerCredentialId) {
  if (!eventId) throw new Error("eventId is required.");
  if (newStatus == null) throw new Error("newStatus is required.");
  if (!organizerCredentialId) throw new Error("organizerCredentialId is required.");

  const organizer = await organizerRepo.findOrganizerByCredentialId(organizerCredentialId);
  if (!organizer) {
    throw new Error("Organizer for this credential does not exist.");
  }

  const existingEvent = await eventRepo.findById(eventId);
  if (!existingEvent) {
    throw new Error("Event not found.");
  }
  if (Number(organizer.company_id) !== Number(existingEvent.company_id)) {
    throw new Unauthorized("Organizer cannot change status for this event.");
  }

  const statusId = typeof newStatus === "number"
    ? newStatus
    : EVENT_STATUS_CODE[String(newStatus).toLowerCase()];

  const updated = await eventRepo.updateEventStatus(eventId, statusId);

  return updated;
}