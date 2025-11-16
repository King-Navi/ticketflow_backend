import { sequelizeCon } from "../config/initPostgre.js";
import Stripe from "stripe";

import EventSeatRepository from "../repositories/eventSeat.repository.js";
import EventRepository from "../repositories/event.repository.js";
import ReservationRepository from "../repositories/reservation.repository.js";
import TicketRepository from "../repositories/ticket.repository.js";
import PaymentRepository from "../repositories/payment.repository.js"
import TicketQrRepository from "../repositories/ticketQr.repository.js"
import TicketCheckInRepository from "../repositories/ticketCheckIn.repository.js"
import RefundRepository from "../repositories/refund.repository.js";
import EventLocationRepository from "../repositories/eventLocation.repository.js"

import { BadRequest, Conflict, NotFound } from "../utils/errors/error.400.js";

import { EVENT_SEAT_STATUS } from "../model_db/utils/eventSeatStatus.js"
import { RESERVATION_STATUS, isValidReservationStatus } from "../model_db/utils/reservationStatus.js";
import { TICKET_STATUS, TICKET_STATUS_ID_TO_CODE } from "../model_db/utils/ticketStatus.js"
import { CHECK_IN_STATUS } from "../model_db/utils/checkInStatus.js"
import { REFUND_STATUS } from "../model_db/utils/refundStatus.js";


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
//This is the endpoint for check-in
const CHECK_IN_PATH = "/v1/ticket/check-in";

/**
 * Build a deterministic idempotency key for Stripe PaymentIntent.
 *
 * We use:
 *   - attendeeId
 *   - eventId
 *   - reservationIds (sorted)
 *
 * Same reservations => same key => same PaymentIntent.
 * New reservations (new reservation_id) => new key => new PaymentIntent.
 */
function buildPaymentIntentIdempotencyKey(attendeeId, eventId, reservations) {
    const reservationIds = reservations
        .map(r => Number(r.reservation_id))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    return `buyticket:${attendeeId}:${eventId}:${reservationIds.join("-")}`;
}

function buildRuntimeIdempotencyKey(attendeeId, eventId, reservations) {
    const baseKey = buildPaymentIntentIdempotencyKey(attendeeId, eventId, reservations);

    if (process.env.DEBUG === "true") {
        return `${baseKey}:${Date.now()}`;
    }

    return baseKey;
}

export async function buyTicketService(
    event_seat_id,
    attendee_id
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
    let categoryLabel;
    let seatLabelPayload;
    const tx = await sequelizeCon.transaction();
    try {
        const eventSeatRepo = new EventSeatRepository();
        const eventRepo = new EventRepository();
        const reservationRepo = new ReservationRepository();
        const ticketRepo = new TicketRepository();
        seats = [];
        for (const seatId of seatIds) {
            const seat = await eventSeatRepo.findById(seatId, { transaction: tx });
            if (!seat) {
                throw new NotFound(`Event seat not found: ${seatId}`);
            }
            seats.push(seat);
        }
        if (seats.length === 0) {
            throw new BadRequest("No seats found for given event_seat_id.");
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

        const event = await eventRepo.ensureEventIsOnSale(eventId, { transaction: tx });
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

        categoryLabel = event.category ?? " ";
        seatLabelPayload = seats.map((s) => ({
            event_seat_id: s.event_seat_id,
            row_no: s.row_no ?? null,
            seat_no: s.seat_no ?? null,
            seat_label:
                s.row_no && s.seat_no
                    ? `Row ${s.row_no} Seat ${s.seat_no}`
                    : `Seat ${s.event_seat_id}`,
        }));

        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    }
    const idempotencyKey = buildRuntimeIdempotencyKey(
        attendee_id,
        eventId,
        reservations
    );

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total_amount * 100),
        currency: "mxn",
        metadata: {
            attendee_id: String(attendee_id),
            event_id: String(eventId),
            seat_ids: seats.map((s) => s.event_seat_id).join(","),
            subtotal: subtotal.toFixed(2),
            tax_amount: tax_amount.toFixed(2),
            category_label: categoryLabel,
            seat_labels: JSON.stringify(seatLabelPayload),
            idempotency_key: idempotencyKey,
        },
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
        },
    },
        idempotencyKey ? { idempotencyKey } : undefined
    );

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

    if (!attendeeId || !eventId || ticket_quantity === 0) {
        throw new Error("Missing or invalid metadata in PaymentIntent.");
    }
    const defaultCategoryLabel = metadata.category_label || " ";
    let seatLabelsById = {};
    if (metadata.seat_labels) {
        try {
            const parsed = JSON.parse(metadata.seat_labels);
            for (const item of parsed) {
                const id = Number(item.event_seat_id);
                if (!Number.isNaN(id)) {
                    seatLabelsById[id] = item;
                }
            }
        } catch (e) {
            if (process.env.DEBUG === "true") {
                console.error("Failed to parse seat_labels metadata:", e);
            }
        }
    }

    const tx = await sequelizeCon.transaction();
    try {
        const paymentRepo = new PaymentRepository();
        const ticketRepo = new TicketRepository();
        const eventSeatRepo = new EventSeatRepository();
        const reservationRepo = new ReservationRepository();

        if (process.env.DEBUG === "true") {
            console.log("DEBUG finalize purchase:", {
                seatIds,
                ticket_quantity,
                subtotal,
                tax_amount,
                total_amount,
                attendeeId,
                eventId,
                stripe_payment_intent_id: paymentIntent.id,
            });
        }



        const existingPayment = await paymentRepo.findByStripePaymentIntentId(
            paymentIntent.id
        );
        if (existingPayment) {
            console.log("PaymentIntent already processed, skipping:", paymentIntent.id);
            await tx.rollback();
            return;
        }

        const paymentId = await paymentRepo.createPayment(
            {
                subtotal,
                tax_percentage: TAX_PERCENTAGE,
                tax_amount,
                total_amount,
                ticket_quantity,
                attendee_id: attendeeId,
                stripe_payment_intent_id: paymentIntent.id,
            },
            { transaction: tx }
        );

        for (const seatId of seatIds) {
            const reservation = await reservationRepo.findActiveNotExpiredBySeatAndAttendee(
                seatId,
                attendeeId,
                { transaction: tx }
            );

            if (reservation) {
                await reservationRepo.markConverted(reservation.reservation_id, { transaction: tx });
            }
            const seat = await eventSeatRepo.findById(seatId, { transaction: tx });
            const unitPrice = Number(seat.base_price);

            const seatMeta = seatLabelsById[seatId] || null;
            const categoryLabel = defaultCategoryLabel;
            const seatLabel = seatMeta?.seat_label ??
                (seatMeta?.row_no && seatMeta?.seat_no
                    ? `Row ${seatMeta.row_no} Seat ${seatMeta.seat_no}`
                    : `Seat ${seatId}`);
            await ticketRepo.createTicketFromSeat(
                {
                    payment_id: paymentId,
                    event_seat_id: seatId,
                    category_label: categoryLabel,
                    seat_label: seatLabel,
                    unit_price: unitPrice,
                },
                { transaction: tx }
            );

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


/**
 * TODO:: decide if "now" is within the valid check-in window.
 * For now, we can allow any time on the same event_date.
 */
function isWithinCheckInWindow(eventRow, now = new Date()) {
    if (!eventRow || !eventRow.event_date) return true;

    const eventDateStr = eventRow.event_date.toISOString().slice(0, 10);
    const nowDateStr = now.toISOString().slice(0, 10);

    return eventDateStr === nowDateStr;
}

export async function checkInWithQrService({ token, scannerId }) {
    if (!token) {
        throw new BadRequest("token is required.");
    }

    const ticketQrRepo = new TicketQrRepository();
    const ticketRepo = new TicketRepository();
    const ticketCheckInRepo = new TicketCheckInRepository();

    const now = new Date();

    const tx = await sequelizeCon.transaction();

    try {
        const qrRow = await ticketQrRepo.findByToken(token, { transaction: tx });
        if (!qrRow) {
            await tx.rollback();
            return {
                ok: false,
                status: "invalid",
                code: CHECK_IN_STATUS.INVALID,
                message: "QR token not recognized.",
            };
        }

        const { ticket_qr_id, ticket_id } = qrRow;

        const ticketWithEvent = await ticketRepo.findTicketWithEventById(ticket_id, {
            transaction: tx,
        });

        if (!ticketWithEvent) {
            await tx.commit();
            return {
                ok: false,
                status: "invalid",
                code: CHECK_IN_STATUS.INVALID,
                message: "Ticket linked to QR was not found.",
            };
        }

        const {
            ticket_id: ticketId,
            ticket_status_id: ticketStatusId,
            category_label,
            seat_label,
            event,
        } = ticketWithEvent;

        if (
            ticketStatusId === TICKET_STATUS.REFUNDED ||
            ticketStatusId === TICKET_STATUS.CANCELED
        ) {
            await ticketCheckInRepo.createCheckIn(
                {
                    ticket_qr_id,
                    check_in_status_id: CHECK_IN_STATUS.INVALID,
                    scanner_id: scannerId,
                },
                { transaction: tx }
            );

            await tx.commit();
            return {
                ok: false,
                status: "invalid",
                code: CHECK_IN_STATUS.INVALID,
                message: "Ticket is refunded or canceled.",
                data: {
                    event_name: event?.event_name ?? null,
                    seat_label,
                    category_label,
                },
            };
        }

        // Check time window
        if (!isWithinCheckInWindow(event, now)) {
            await ticketCheckInRepo.createCheckIn(
                {
                    ticket_qr_id,
                    check_in_status_id: CHECK_IN_STATUS.OUTSIDE_WINDOW,
                    scanner_id: scannerId,
                },
                { transaction: tx }
            );

            await tx.commit();
            return {
                ok: false,
                status: "outside_window",
                code: CHECK_IN_STATUS.OUTSIDE_WINDOW,
                message: "Ticket cannot be checked in at this time.",
                data: {
                    event_name: event?.event_name ?? null,
                    event_date: event?.event_date ?? null,
                    start_time: event?.start_time ?? null,
                    end_time: event?.end_time ?? null,
                    seat_label,
                    category_label,
                },
            };
        }

        const firstOkCheckIn = await ticketCheckInRepo.findFirstSuccessfulCheckIn(
            ticket_qr_id,
            { transaction: tx }
        );

        if (firstOkCheckIn) {
            await ticketCheckInRepo.createCheckIn(
                {
                    ticket_qr_id,
                    check_in_status_id: CHECK_IN_STATUS.DUPLICATE,
                    scanner_id: scannerId,
                },
                { transaction: tx }
            );

            await tx.commit();
            return {
                ok: false,
                status: "duplicate",
                code: CHECK_IN_STATUS.DUPLICATE,
                message: "Ticket has already been checked in.",
                data: {
                    event_name: event?.event_name ?? null,
                    event_date: event?.event_date ?? null,
                    start_time: event?.start_time ?? null,
                    end_time: event?.end_time ?? null,
                    seat_label,
                    category_label,
                    first_check_in_at: firstOkCheckIn.scanned_at,
                },
            };
        }

        await ticketCheckInRepo.createCheckIn(
            {
                ticket_qr_id,
                check_in_status_id: CHECK_IN_STATUS.OK,
                scanner_id: scannerId,
            },
            { transaction: tx }
        );

        if (ticketStatusId !== TICKET_STATUS.CHECKED_IN) {
            await ticketRepo.updateStatusAndCheckInAt(
                ticketId,
                TICKET_STATUS.CHECKED_IN,
                now,
                { transaction: tx }
            );
        }

        await tx.commit();

        return {
            ok: true,
            status: "ok",
            code: CHECK_IN_STATUS.OK,
            message: "Ticket successfully checked in.",
            data: {
                event_id: event?.event_id ?? null,
                event_name: event?.event_name ?? null,
                event_date: event?.event_date ?? null,
                start_time: event?.start_time ?? null,
                end_time: event?.end_time ?? null,
                ticket_id: ticketId,
                seat_label,
                category_label,
                checked_in_at: now,
            },
        };
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}


export async function getTicketQrService(ticketId, attendeeId) {
    if (!ticketId) {
        throw new BadRequest("ticketId is required.");
    }
    if (!attendeeId) {
        throw new BadRequest("attendee_id is required.");
    }

    const ticketRepo = new TicketRepository();
    const ticketQrRepo = new TicketQrRepository();

    const ticket = await ticketRepo.findByIdAndAttendee(ticketId, attendeeId);
    if (!ticket) {
        throw new NotFound("Ticket not found for this attendee.");
    }

    const qrRow = await ticketQrRepo.findByTicketId(ticketId);
    if (!qrRow) {
        throw new NotFound("QR token not found for this ticket.");
    }

    const token = qrRow.token;

    const qrPayload = `${CHECK_IN_PATH}?token=${encodeURIComponent(token)}`;

    return {
        ok: true,
        ticket_id: ticketId,
        seat_label: ticket?.seat_label,
        category_label: ticket?.category_label,
        token,
        check_in_path: CHECK_IN_PATH,
        qr_payload: qrPayload,
    };
}

export async function getAttendeeTicketsService(attendeeId, eventStatusCode) {
    if (!attendeeId) {
        throw new BadRequest("attendee_id is required.");
    }

    const normalizedStatusCode =
        typeof eventStatusCode === "string" && eventStatusCode.trim() !== ""
            ? eventStatusCode.trim().toLowerCase()
            : null;

    const ticketRepo = new TicketRepository();

    const rows = await ticketRepo.findEventsWithTicketsByAttendee(
        attendeeId,
        { eventStatusCode: normalizedStatusCode }
    );
    const events = rows.map(row => ({
        event_id: row.event_id,
        event_name: row.event_name,
        category: row.category,
        description: row.description,
        event_date: row.event_date,
        start_time: row.start_time,
        end_time: row.end_time,
        event_status_id: row.event_status_id,
        event_status_code: row.event_status_code,
        event_location_id: row.event_location_id,
        venue_name: row.venue_name,
        city: row.city,
        country: row.country,
        tickets: row.tickets || [],
    }));



    return {
        ok: true,
        attendee_id: attendeeId,
        filters: {
            event_status_code: normalizedStatusCode,
        },
        events,
    };
}

export async function refundTicketService({ ticketId, attendeeId, reason }) {
    if (!ticketId) {
        throw new BadRequest("ticketId is required.");
    }
    if (!attendeeId) {
        throw new BadRequest("attendee_id is required.");
    }
    if (!reason || typeof reason !== "string") {
        throw new BadRequest("reason is required and must be a string.");
    }

    const ticketRepo = new TicketRepository();
    const paymentRepo = new PaymentRepository();
    const refundRepo = new RefundRepository();
    const eventLocationRepo = new EventLocationRepository();

    const tx1 = await sequelizeCon.transaction();
    let refundRow;
    let refundAmount = 0;
    let stripePaymentIntentId;
    let policyCode = null;
    let eventSeatId;

    try {
        const ticketBasic = await ticketRepo.findByIdAndAttendee(
            ticketId,
            attendeeId,
            { transaction: tx1 }
        );
        if (!ticketBasic) {
            throw new NotFound("Ticket not found for this attendee.");
        }

        const { payment_id, ticket_status_id, unit_price, event_seat_id } = ticketBasic;
        eventSeatId = event_seat_id;

        if (ticket_status_id === TICKET_STATUS.CHECKED_IN) {
            throw new Conflict("Checked-in tickets cannot be refunded.");
        }
        if (ticket_status_id === TICKET_STATUS.REFUNDED) {
            throw new Conflict("Ticket is already refunded.");
        }
        if (ticket_status_id === TICKET_STATUS.CANCELED) {
            throw new Conflict("Canceled tickets cannot be refunded.");
        }

        const existingRefund = await refundRepo.findByTicketId(ticketId, { transaction: tx1 });
        if (existingRefund) {
            throw new Conflict("This ticket already has a refund record.");
        }

        const ticketWithEvent = await ticketRepo.findTicketWithEventById(ticketId, {
            transaction: tx1,
        });
        if (!ticketWithEvent) {
            throw new BadRequest("Event info for this ticket is missing.");
        }

        const eventLocationId = ticketWithEvent.event_location_id;
        if (!eventLocationId) {
            throw new BadRequest("Event location is missing for this ticket.");
        }

        const eventLocation = await eventLocationRepo.findById(eventLocationId, {
            transaction: tx1,
        });
        if (!eventLocation) {
            throw new BadRequest("Event location record not found.");
        }

        if (eventLocation.is_refundable === false) {
            throw new Conflict("Refunds are not allowed for this venue.");
        }

        if (eventLocation.refundable_until) {
            const now = new Date();
            const limit = new Date(eventLocation.refundable_until);
            if (limit < now) {
                throw new Conflict("Refund window has expired.");
            }
        }

        policyCode = eventLocation.refund_policy_code || null;

        const paymentRow = await paymentRepo.findById(payment_id, { transaction: tx1 });
        if (!paymentRow) {
            throw new BadRequest("Payment record not found for this ticket.");
        }

        stripePaymentIntentId = paymentRow.stripe_payment_intent_id;
        if (!stripePaymentIntentId) {
            throw new BadRequest("Ticket payment does not have a Stripe PaymentIntent associated.");
        }

        refundAmount = Number(unit_price);
        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            throw new BadRequest("Refund amount must be greater than zero.");
        }

        refundRow = await refundRepo.createRefund(
            {
                ticket_id: ticketId,
                refund_amount: refundAmount,
                reason,
                refund_status_id: REFUND_STATUS.REQUESTED,
                policy_code: policyCode,
            },
            { transaction: tx1 }
        );

        await tx1.commit();
    } catch (err) {
        await tx1.rollback();
        throw err;
    }

    let stripeRefund;
    try {
        const amountInCents = Math.round(refundAmount * 100);
        stripeRefund = await stripe.refunds.create({
            payment_intent: stripePaymentIntentId,
            amount: amountInCents,
        });
    } catch (err) {
        const txErr = await sequelizeCon.transaction();
        try {
            await refundRepo.updateStripeInfoAndStatus(
                refundRow.refund_id,
                {
                    refund_status_id: REFUND_STATUS.REJECTED,
                    stripe_refund_id: null,
                    stripe_refund_status_raw: "stripe_error",
                },
                { transaction: txErr }
            );
            await txErr.commit();
        } catch (e) {
            await txErr.rollback();
        }

        throw new BadRequest("Stripe refund failed.");
    }

    const stripeStatus = stripeRefund.status || "unknown";
    let internalStatusId = REFUND_STATUS.APPROVED;
    if (stripeStatus === "succeeded") {
        internalStatusId = REFUND_STATUS.PROCESSED;
    } else if (stripeStatus === "pending") {
        internalStatusId = REFUND_STATUS.APPROVED;
    } else if (stripeStatus === "failed" || stripeStatus === "canceled") {
        internalStatusId = REFUND_STATUS.REJECTED;
    }

    const tx2 = await sequelizeCon.transaction();
    try {
        await refundRepo.updateStripeInfoAndStatus(
            refundRow.refund_id,
            {
                refund_status_id: internalStatusId,
                stripe_refund_id: stripeRefund.id,
                stripe_refund_status_raw: stripeStatus,
            },
            { transaction: tx2 }
        );

        if (internalStatusId === REFUND_STATUS.PROCESSED) {
            await ticketRepo.updateStatusAndCheckInAt(
                ticketId,
                TICKET_STATUS.REFUNDED,
                null,
                { transaction: tx2 }
            );

            // free the event_seat (TODO: this work?)
            const eventSeatRepo = new EventSeatRepository();
            await eventSeatRepo.updateEventSeatStatus(
                eventSeatId,
                EVENT_SEAT_STATUS.AVAILABLE,
                { transaction: tx2 }
            );
        }

        await tx2.commit();
    } catch (err) {
        await tx2.rollback();
        throw err;
    }

    return {
        ok: true,
        refund_id: refundRow.refund_id,
        ticket_id: ticketId,
        amount: refundAmount,
        currency: "mxn",
        stripe_refund_id: stripeRefund.id,
        stripe_status: stripeStatus,
        internal_status_id: internalStatusId,
    };
}