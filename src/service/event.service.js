import EventRepository from "../repositories/event.repository.js";
import CompanyRepository from "../repositories/company.repository.js";
import EventLocationRepository from "../repositories/eventLocation.repository.js";
import OrganizerRepository from "../repositories/organizer.repository.js";

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
    throw new Error(`Organizer cannot create events for company ${company_id}.`);
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