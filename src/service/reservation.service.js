import EventRepository from "../repositories/event.repository.js";
import EventSeatRepository from "../repositories/eventSeat.repository.js";
import ReservationRepository from "../repositories/reservation.repository.js";
import TicketRepository from "../repositories/ticket.repository.js";
import { BadRequest, Conflict } from "../utils/errors/error.400.js";
import { EVENT_SEAT_STATUS } from "../model_db/utils/eventSeatStatus.js";

const MAX_RESERVATION_MINUTES = 15;

const eventRepo = new EventRepository();
const eventSeatRepo = new EventSeatRepository();
const reservationRepo = new ReservationRepository();
const ticketRepo = new TicketRepository();


/**
 * Create a reservation for a specific event seat.
 *
 * @param {number} event_id
 * @param {number} attendee_id
 * @param {number} event_seat_id
 * @param {Date|string} expiration_at
 * @param {object} [options]
 * @param {import('sequelize').Transaction} [options.transaction]
 */
export async function createReservationService(
    event_id,
    attendee_id,
    event_seat_id,
    expiration_at,
    { transaction } = {}
) {
    if (!event_id) throw new BadRequest("event_id is required.");
    if (!attendee_id) throw new BadRequest("attendee_id is required.");
    if (!event_seat_id) throw new BadRequest("event_seat_id is required.");


    const now = new Date();
    const maxExpiration = new Date(now.getTime() + MAX_RESERVATION_MINUTES * 60 * 1000);

    let clientExpiration = expiration_at ? new Date(expiration_at) : null;
    if (!clientExpiration || isNaN(clientExpiration.getTime())) {
        clientExpiration = maxExpiration;
    }

    const finalExpiration =
        clientExpiration > maxExpiration ? maxExpiration : clientExpiration;

    // 1. VERIFY EVENT IS ALLOWED TO SELL / RESERVE
    const event = await eventRepo.ensureEventIsOnSale(event_id, { transaction });




    // 2. verify that this event_seat_id actually belongs to this event_id
    // (query event_seat where event_id = event_id AND event_seat_id = event_seat_id)
    const eventSeat = await eventSeatRepo.ensureEventSeatBelongsToEvent(
        event_id,
        event_seat_id,
        { transaction }
    );

    // 3. check there is no ACTIVE, NOT-EXPIRED reservation for this event_seat_id

    const existingActiveReservation =
        await reservationRepo.findActiveNotExpiredByEventSeatId(event_seat_id, {
            transaction,
        });

    if (existingActiveReservation) {
        const err = new Conflict("This seat is already reserved by someone else.");
        err.meta = {
            reservation_id: existingActiveReservation.reservation_id,
            expires_at: existingActiveReservation.expiration_at,
            reserved_by_attendee_id: existingActiveReservation.attendee_id,
            current_attendee_id: attendee_id,
        };
        throw err;
    }

    // 4. check ticket for this event_seat_id and reject if sold/checked_in
    const existingTicket = await ticketRepo.findByEventSeatId(event_seat_id, {
        transaction,
    });

    if (existingTicket) {
        if (ticketRepo.isBlockingStatus(existingTicket.ticket_status_id)) {
            const err = new Conflict("This seat already has a sold/checked-in ticket.");
            err.meta = {
                ticket_id: existingTicket.ticket_id,
                ticket_status_id: existingTicket.ticket_status_id,
            };
            throw err;
        }
    }


    // 5.(optional) check event_seat_status is not blocked/sold
    if (eventSeat.event_seat_status_id !== EVENT_SEAT_STATUS.AVAILABLE) {
        const err = new Conflict("This seat is not available for reservation.");
        err.meta = {
            current_status_id: eventSeat.event_seat_status_id,
            allowed_status_id: EVENT_SEAT_STATUS.AVAILABLE,
        };
        throw err;
    }
    // 6. create reservation row + update event_seat to "reserved"
    const reservation = await reservationRepo.createReservation(
        {
            attendee_id,
            event_seat_id,
            expiration_at: finalExpiration,
        },
        { transaction }
    );
    const updatedSeat = await eventSeatRepo.updateEventSeatStatus(
        event_seat_id,
        EVENT_SEAT_STATUS.RESERVED,
        { transaction }
    );
    return {
        ok: true,
        message: "Reservation created and seat marked as reserved.",
        reservation,
        event,
        eventSeat: updatedSeat,
    };
}   