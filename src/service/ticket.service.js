import EventSeatRepository from "../repositories/eventSeat.repository.js";
import EventRepository from "../repositories/event.repository.js";
import ReservationRepository from "../repositories/reservation.repository.js";
import TicketRepository from "../repositories/ticket.repository.js";
import {
    EVENT_SEAT_STATUS,
    EVENT_SEAT_STATUS_CODE
} from "../model_db/utils/eventSeatStatus.js"
import { BadRequest, Conflict, NotFound } from "../utils/errors/error.400.js";
import { sequelizeCon } from "../config/initPostgre.js";
import { RESERVATION_STATUS, isValidReservationStatus } from "../model_db/utils/reservationStatus.js";
import Stripe from "stripe";

let stripe;
let endpointSecret;
if (process.env.DEBUG === "true") {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY_DEV);
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV;
} else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
}

const TAX_PERCENTAGE = 16;

export async function buyTicketService(
    event_seat_id,
    attendee_id,
    { holdMinutes = 5 } = {}
) {
    if (!event_seat_id) {
        throw new BadRequest("event_seat_id is required.");
    }
    if (!attendee_id) {
        throw new BadRequest("attendee_id is required.");
    }
    const seatIds = Array.isArray(event_seat_id)
        ? event_seat_id
        : [event_seat_id];
    if (seatIds.length === 0) {
        throw new BadRequest("At least one event_seat_id is required.");
    }
    let seats = [];
    let reservations = [];
    let eventId = null;
    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;
    let ticket_quantity = 0;
    const tx = await sequelizeCon.transaction();
    try {
        const eventSeatRepo = new EventSeatRepository();
        const eventRepo = new EventRepository();
        const reservationRepo = new ReservationRepository();
        const ticketRepo = new TicketRepository();
        const seats = [];
        for (const seatId of seatIds) {
            const seat = await eventSeatRepo.findById(seatId, { transaction: tx });
            if (!seat) {
                throw new NotFound(`Event seat not found: ${seatId}`);
            }
            seats.push(seat);
        }
        eventId = seats[0].event_id;
        for (const seat of seats) {
            if (seat.event_id !== eventId) {
                const err = new Conflict("All seats must belong to the same event.");
                err.meta = {
                    expected_event_id: eventId,
                    seat_event_id: seat.event_id,
                    seat_id: seat.event_seat_id,
                };
                throw err;
            }
            await eventSeatRepo.ensureEventSeatBelongsToEvent(
                eventId,
                seat.event_seat_id, {
                transaction: tx,
            });
        }

        await eventRepo.ensureEventIsOnSale(eventId, { transaction: tx });
        const collectedReservations = [];

        for (const seat of seats) {
            if (seat.event_seat_status_id !== EVENT_SEAT_STATUS.RESERVED) {
                const err = new Conflict("Seat is not reserved. Purchase is not allowed.");
                err.meta = {
                    seat_id: seat.event_seat_id,
                    current_status_id: seat.event_seat_status_id,
                    required_status_id: EVENT_SEAT_STATUS.RESERVED,
                };
                throw err;
            }

            const tickets = await ticketRepo.findAllByEventSeatId(seat.event_seat_id, {
                transaction: tx,
            });
            if (tickets.length > 0) {
                const blocking = tickets.find((t) =>
                    ticketRepo.isBlockingStatus(t.ticket_status_id)
                );
                if (blocking) {
                    const err = new Conflict("This seat already has a blocking ticket.");
                    err.meta = {
                        seat_id: seat.event_seat_id,
                        ticket_id: blocking.ticket_id,
                        ticket_status_id: blocking.ticket_status_id,
                    };
                    throw err;
                }
            }

            const reservation =
                await reservationRepo.findActiveNotExpiredBySeatAndAttendee(
                    seat.event_seat_id,
                    attendee_id,
                    { transaction: tx }
                );
            if (!reservation) {
                const err = new Conflict(
                    "There is no active reservation for this seat and attendee."
                );
                err.meta = {
                    seat_id: seat.event_seat_id,
                    attendee_id,
                };
                throw err;
            }
            collectedReservations.push(reservation);
        }

        reservations = collectedReservations;
        subtotal = seats
            .map((s) => Number(s.base_price))
            .reduce((acc, n) => acc + n, 0);
        const taxAmountRaw = subtotal * (TAX_PERCENTAGE / 100);
        tax_amount = Number(taxAmountRaw.toFixed(2));
        total_amount = Number((subtotal + tax_amount).toFixed(2));
        ticket_quantity = seats.length;

        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total_amount * 100),
        currency: "mxn",
        metadata: {
            attendee_id: String(attendee_id),
            event_id: String(eventId),
            seat_ids: seats.map((s) => s.event_seat_id).join(","),
            subtotal: subtotal.toFixed(2),
            tax_amount: tax_amount.toFixed(2),
        },
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
        },
    });

    if (process.env.DEBUG === "true") {
        console.log("======ID_PAYMENT======");
        console.log(paymentIntent.id);
        console.log("======END_ID_PAYMENT======");
    }

    return {
        ok: true,
        step: "stripe-payment-intent-created",
        stripe_client_secret: paymentIntent.client_secret,
        payment_snapshot: {
            subtotal: Number(subtotal.toFixed(2)),
            tax_percentage: TAX_PERCENTAGE,
            tax_amount,
            total_amount,
            ticket_quantity,
        },
        seats: seats.map((s) => ({
            id: s.event_seat_id,
            price: Number(s.base_price),
        })),
        reservations: reservations.map((r) => ({
            id: r.reservation_id,
            seat_id: r.event_seat_id,
            expires_at: r.expiration_at,
        })),
    };
}


export async function finalizeTicketPurchaseFromStripe(paymentIntent) {
    const metadata = paymentIntent.metadata || {};
    const attendeeId = Number(metadata.attendee_id);
    const eventId = Number(metadata.event_id);
    const seatIds = (metadata.seat_ids || "")
        .split(",")
        .map(s => Number(s))
        .filter(Boolean);

    const subtotal = Number(metadata.subtotal);
    const tax_amount = Number(metadata.tax_amount);
    const total_amount = paymentIntent.amount_received
        ? paymentIntent.amount_received / 100
        : Number(metadata.total_amount);
    const ticket_quantity = seatIds.length;

    const tx = await sequelizeCon.transaction();
    try {
        //TODO.: ver si va aqui y si es necesario
        const paymentRepo = new PaymentRepository();
        const ticketRepo = new TicketRepository();
        const eventSeatRepo = new EventSeatRepository();
        const reservationRepo = new ReservationRepository();

        // 1. crear payment TODO :
        const paymentId = await paymentRepo.createPayment({
            subtotal,
            tax_percentage: 16,
            tax_amount,
            total_amount,
            ticket_quantity,
            attendee_id: attendeeId,
            // payment_method_id: ... (depende de tu modelo),
            // puedes guardar el paymentIntent.id en una columna extra
            stripe_payment_intent_id: paymentIntent.id,
        }, { transaction: tx });

        // 2. por cada seat: marcar reserva como converted y crear ticket
        for (const seatId of seatIds) {
            // traer la reserva activa de ese seat para este attendee
            const reservation = await reservationRepo.findActiveNotExpiredBySeatAndAttendee(
                seatId,
                attendeeId,
                { transaction: tx }
            );

            if (reservation) {
                // TODO: update reservation to converted
                await reservationRepo.markConverted(reservation.reservation_id, { transaction: tx });
            }
            const seat = await eventSeatRepo.findById(seatId, { transaction: tx });
            const unitPrice = Number(seat.base_price);
            // TODO: crear ticket CON LA FUNCION DE LA BD 'fn01_create_ticket_with_qr'
            await ticketRepo.createTicketFromSeat({
                payment_id: paymentId,
                event_seat_id: seatId,
                unit_price: unitPrice,
                ticket_status_code: "sold",
            }, { transaction: tx });

            // marcar seat como SOLD
            await eventSeatRepo.updateEventSeatStatus(
                seatId,
                EVENT_SEAT_STATUS.SOLD,
                { transaction: tx }
            );
        }

        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}