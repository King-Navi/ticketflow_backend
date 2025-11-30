import { jest } from "@jest/globals";
import { BadRequest, Conflict, NotFound } from "../../utils/errors/error.400.js";
import { sequelizeCon } from "../../config/initPostgre.js";

import EventSeatRepository from "../../repositories/eventSeat.repository.js";
import EventRepository from "../../repositories/event.repository.js";
import ReservationRepository from "../../repositories/reservation.repository.js";
import TicketRepository from "../../repositories/ticket.repository.js";
import PaymentRepository from "../../repositories/payment.repository.js";
import TicketQrRepository from "../../repositories/ticketQr.repository.js";
import TicketCheckInRepository from "../../repositories/ticketCheckIn.repository.js";
import RefundRepository from "../../repositories/refund.repository.js";
import EventLocationRepository from "../../repositories/eventLocation.repository.js";

import { EVENT_SEAT_STATUS } from "../../model_db/utils/eventSeatStatus.js";
import { TICKET_STATUS } from "../../model_db/utils/ticketStatus.js";
import { CHECK_IN_STATUS } from "../../model_db/utils/checkInStatus.js";
import { REFUND_STATUS } from "../../model_db/utils/refundStatus.js";

// Stripe mocks, siempre definidos
export const stripePaymentIntentsCreate = jest.fn();
export const stripeRefundsCreate = jest.fn();

// Mock de módulo "stripe"
await jest.unstable_mockModule("stripe", () => {
    const StripeMock = jest.fn().mockImplementation(() => ({
        paymentIntents: {
            create: stripePaymentIntentsCreate,
        },
        refunds: {
            create: stripeRefundsCreate,
        },
    }));

    return {
        __esModule: true,
        default: StripeMock,
    };
});

const {
    buyTicketService,
    finalizeTicketPurchaseFromStripe,
    checkInWithQrService,
    getTicketQrService,
    getAttendeeTicketsService,
    refundTicketService,
} = await import("../../service/ticket.service.js");

// Simulación de transacciones de sequelizeCon
let txList = [];

beforeEach(() => {
    jest.clearAllMocks();

    txList = [];

    // Reset explícito de los mocks de Stripe
    stripePaymentIntentsCreate.mockReset();
    stripeRefundsCreate.mockReset();

    // Mock de transaction que soporta:
    //  - sequelizeCon.transaction(callback)
    //  - sequelizeCon.transaction()
    sequelizeCon.transaction = jest.fn((arg) => {
        const tx = {
            commit: jest.fn().mockResolvedValue(),
            rollback: jest.fn().mockResolvedValue(),
        };
        txList.push(tx);

        if (typeof arg === "function") {
            return Promise.resolve(arg(tx));
        }

        return Promise.resolve(tx);
    });
});

// buyTicketService
describe("buyTicketService", () => {
    test("buyTicketService_MissingEventSeatId_ThrowsBadRequest", async () => {
        await expect(buyTicketService(null, 123)).rejects.toBeInstanceOf(BadRequest);
        await expect(buyTicketService(null, 123)).rejects.toThrow("event_seat_id is required.");
    });

    test("buyTicketService_MissingAttendeeId_ThrowsBadRequest", async () => {
        await expect(buyTicketService(10, null)).rejects.toBeInstanceOf(BadRequest);
        await expect(buyTicketService(10, null)).rejects.toThrow("attendee_id is required.");
    });

    test("buyTicketService_ValidSingleSeat_CreatesStripePaymentIntent", async () => {
        jest
            .spyOn(EventSeatRepository.prototype, "findById")
            .mockResolvedValue({
                event_seat_id: 1,
                event_id: 10,
                base_price: 100,
                event_seat_status_id: EVENT_SEAT_STATUS.RESERVED,
                row_no: "A",
                seat_no: "10",
            });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id: 1,
                event_id: 10,
            });

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({
                event_id: 10,
                category: "concert",
                event_name: "Test Event",
            });

        jest
            .spyOn(TicketRepository.prototype, "findAllByEventSeatId")
            .mockResolvedValue([]); // sin tickets bloqueando

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredBySeatAndAttendee")
            .mockResolvedValue({
                reservation_id: 50,
                event_seat_id: 1,
                attendee_id: 99,
                expiration_at: new Date(Date.now() + 5 * 60 * 1000),
            });

        // El servicio no depende realmente del valor devuelto, pero por claridad:
        stripePaymentIntentsCreate.mockResolvedValue({
            id: "pi_123",
            client_secret: "cs_test_123",
        });

        const result = await buyTicketService(1, 99);

        expect(result.ok).toBe(true);
        expect(result.payment_snapshot.total_amount).toBe(116); // 100 + 16%

        // se llamó a Stripe con los montos correctos
        expect(stripePaymentIntentsCreate).toHaveBeenCalledTimes(1);
        const stripeArgs = stripePaymentIntentsCreate.mock.calls[0][0];

        expect(stripeArgs.amount).toBe(11600); // centavos
        expect(stripeArgs.currency).toBe("mxn");
    });

    test("buyTicketService_SeatNotReserved_ThrowsConflict", async () => {
        jest
            .spyOn(EventSeatRepository.prototype, "findById")
            .mockResolvedValue({
                event_seat_id: 1,
                event_id: 10,
                base_price: 100,
                event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE, // no reservado
            });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id: 1,
                event_id: 10,
            });

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({
                event_id: 10,
            });

        jest
            .spyOn(TicketRepository.prototype, "findAllByEventSeatId")
            .mockResolvedValue([]);

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredBySeatAndAttendee")
            .mockResolvedValue({
                reservation_id: 70,
                event_seat_id: 1,
                attendee_id: 99,
                expiration_at: new Date(Date.now() + 5 * 60 * 1000),
            });

        const promise = buyTicketService(1, 99);

        await expect(promise).rejects.toBeInstanceOf(Conflict);
        await expect(promise).rejects.toThrow("Seat is not reserved. Purchase is not allowed.");
    });
});

// finalizeTicketPurchaseFromStripe
describe("finalizeTicketPurchaseFromStripe", () => {
    test("finalizeTicketPurchaseFromStripe_InvalidMetadata_ThrowsError", async () => {
        const paymentIntent = {
            id: "pi_invalid",
            amount_received: 1000,
            metadata: {
                attendee_id: "",
                event_id: "",
                seat_ids: "",
            },
        };

        await expect(finalizeTicketPurchaseFromStripe(paymentIntent)).rejects.toThrow(
            "Missing or invalid metadata in PaymentIntent."
        );
    });

    test("finalizeTicketPurchaseFromStripe_ExistingPayment_SkipsProcessing", async () => {
        const paymentIntent = {
            id: "pi_processed",
            amount_received: 23200,
            metadata: {
                attendee_id: "99",
                event_id: "10",
                seat_ids: "1,2",
                subtotal: "200.00",
                tax_amount: "32.00",
                total_amount: "232.00",
                category_label: "concert",
                seat_labels: JSON.stringify([
                    { event_seat_id: 1, seat_label: "Row A Seat 1" },
                    { event_seat_id: 2, seat_label: "Row A Seat 2" },
                ]),
            },
        };

        jest
            .spyOn(PaymentRepository.prototype, "findByStripePaymentIntentId")
            .mockResolvedValue({ payment_id: 10 });

        const createPaymentSpy = jest
            .spyOn(PaymentRepository.prototype, "createPayment")
            .mockResolvedValue(20);

        await finalizeTicketPurchaseFromStripe(paymentIntent);

        // En este path, el service hace rollback y retorna sin crear nada
        expect(txList).toHaveLength(1);
        expect(txList[0].rollback).toHaveBeenCalled();
        expect(createPaymentSpy).not.toHaveBeenCalled();
    });
});

// checkInWithQrService
describe("checkInWithQrService", () => {
    test("checkInWithQrService_MissingToken_ThrowsBadRequest", async () => {
        await expect(checkInWithQrService({ token: null, scannerId: 1 })).rejects.toBeInstanceOf(
            BadRequest
        );
        await expect(checkInWithQrService({ token: null, scannerId: 1 })).rejects.toThrow(
            "token is required."
        );
    });

    test("checkInWithQrService_UnknownToken_ReturnsInvalid", async () => {
        jest
            .spyOn(TicketQrRepository.prototype, "findByToken")
            .mockResolvedValue(null);

        const result = await checkInWithQrService({ token: "nope", scannerId: 1 });

        // En este path, el service hace rollback explícito
        expect(txList).toHaveLength(1);
        expect(txList[0].rollback).toHaveBeenCalled();

        expect(result.ok).toBe(false);
        expect(result.status).toBe("invalid");
        expect(result.code).toBe(CHECK_IN_STATUS.INVALID);
        expect(result.message).toBe("QR token not recognized.");
    });

    test("checkInWithQrService_SuccessfulCheckIn_ReturnsOkAndUpdatesTicket", async () => {
        const now = new Date();
        const eventDate = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");

        jest
            .spyOn(TicketQrRepository.prototype, "findByToken")
            .mockResolvedValue({
                ticket_qr_id: 5,
                ticket_id: 100,
            });

        jest
            .spyOn(TicketRepository.prototype, "findTicketWithEventById")
            .mockResolvedValue({
                ticket_id: 100,
                ticket_status_id: TICKET_STATUS.SOLD, // ni REFUNDED ni CANCELED
                category_label: "VIP",
                seat_label: "Row A Seat 10",
                event: {
                    event_id: 10,
                    event_name: "Test Concert",
                    event_date: eventDate,
                    start_time: "20:00:00",
                    end_time: "22:00:00",
                },
            });

        jest
            .spyOn(TicketCheckInRepository.prototype, "findFirstSuccessfulCheckIn")
            .mockResolvedValue(null);

        const createCheckInSpy = jest
            .spyOn(TicketCheckInRepository.prototype, "createCheckIn")
            .mockResolvedValue({
                ticket_check_in_id: 1,
            });

        const updateStatusSpy = jest
            .spyOn(TicketRepository.prototype, "updateStatusAndCheckInAt")
            .mockResolvedValue({});

        const result = await checkInWithQrService({ token: "valid-token", scannerId: 77 });

        expect(txList).toHaveLength(1);
        expect(txList[0].commit).toHaveBeenCalled();

        expect(createCheckInSpy).toHaveBeenCalledTimes(1);
        expect(updateStatusSpy).toHaveBeenCalledTimes(1);

        expect(result.ok).toBe(true);
        expect(result.status).toBe("ok");
        expect(result.data.ticket_id).toBe(100);
        expect(result.data.event_name).toBe("Test Concert");
    });
});

// getTicketQrService
describe("getTicketQrService", () => {
    test("getTicketQrService_MissingTicketId_ThrowsBadRequest", async () => {
        await expect(getTicketQrService(null, 123)).rejects.toBeInstanceOf(BadRequest);
        await expect(getTicketQrService(null, 123)).rejects.toThrow("ticketId is required.");
    });

    test("getTicketQrService_ValidTicketAndQr_ReturnsPayload", async () => {
        jest
            .spyOn(TicketRepository.prototype, "findByIdAndAttendee")
            .mockResolvedValue({
                ticket_id: 10,
                seat_label: "Row B Seat 5",
                category_label: "general",
            });

        jest
            .spyOn(TicketQrRepository.prototype, "findByTicketId")
            .mockResolvedValue({
                ticket_qr_id: 9,
                token: "abc123",
            });

        const result = await getTicketQrService(10, 777);

        expect(result.ok).toBe(true);
        expect(result.ticket_id).toBe(10);
        expect(result.token).toBe("abc123");
        expect(result.qr_payload).toContain("token=abc123");
    });
});

// getAttendeeTicketsService
describe("getAttendeeTicketsService", () => {
    test("getAttendeeTicketsService_MissingAttendee_ThrowsBadRequest", async () => {
        await expect(getAttendeeTicketsService(null, null)).rejects.toBeInstanceOf(BadRequest);
        await expect(getAttendeeTicketsService(null, null)).rejects.toThrow(
            "attendee_id is required."
        );
    });

    test("getAttendeeTicketsService_Valid_ReturnsEvents", async () => {
        jest
            .spyOn(TicketRepository.prototype, "findEventsWithTicketsByAttendee")
            .mockResolvedValue([
                {
                    event_id: 10,
                    event_name: "Rock Fest",
                    category: "concert",
                    description: "Awesome show",
                    event_date: new Date("2025-01-01"),
                    start_time: "20:00:00",
                    end_time: "23:00:00",
                    event_status_id: 1,
                    event_status_code: "on_sale",
                    event_location_id: 5,
                    venue_name: "Main Hall",
                    city: "CDMX",
                    country: "MX",
                    tickets: [
                        {
                            ticket_id: 100,
                            seat_label: "Row A Seat 1",
                        },
                    ],
                },
            ]);

        const result = await getAttendeeTicketsService(999, "on_sale");

        expect(result.ok).toBe(true);
        expect(result.attendee_id).toBe(999);
        expect(result.events.length).toBe(1);
        expect(result.events[0].event_name).toBe("Rock Fest");
        expect(result.events[0].tickets[0].ticket_id).toBe(100);
    });
});

// refundTicketService
describe("refundTicketService", () => {
    test("refundTicketService_MissingTicketId_ThrowsBadRequest", async () => {
        await expect(
            refundTicketService({ ticketId: null, attendeeId: 1, reason: "Test" })
        ).rejects.toBeInstanceOf(BadRequest);

        await expect(
            refundTicketService({ ticketId: null, attendeeId: 1, reason: "Test" })
        ).rejects.toThrow("ticketId is required.");
    });

    test("refundTicketService_VenueNotRefundable_ThrowsConflict", async () => {
        jest
            .spyOn(TicketRepository.prototype, "findByIdAndAttendee")
            .mockResolvedValue({
                ticket_id: 10,
                payment_id: 20,
                ticket_status_id: TICKET_STATUS.SOLD,
                unit_price: 100,
                event_seat_id: 30,
            });

        jest
            .spyOn(RefundRepository.prototype, "findByTicketId")
            .mockResolvedValue(null);

        jest
            .spyOn(TicketRepository.prototype, "findTicketWithEventById")
            .mockResolvedValue({
                ticket_id: 10,
                event_location_id: 99,
            });

        jest
            .spyOn(EventLocationRepository.prototype, "findById")
            .mockResolvedValue({
                event_location_id: 99,
                is_refundable: false,
                refund_policy_code: "NO_REFUNDS",
            });

        await expect(
            refundTicketService({ ticketId: 10, attendeeId: 777, reason: "I can't attend" })
        ).rejects.toBeInstanceOf(Conflict);

        await expect(
            refundTicketService({ ticketId: 10, attendeeId: 777, reason: "I can't attend" })
        ).rejects.toThrow("Refunds are not allowed for this venue.");
    });

    test("refundTicketService_SuccessfulStripeRefund_UpdatesTicketAndSeat", async () => {
        jest
            .spyOn(TicketRepository.prototype, "findByIdAndAttendee")
            .mockResolvedValue({
                ticket_id: 10,
                payment_id: 20,
                ticket_status_id: TICKET_STATUS.SOLD,
                unit_price: 150,
                event_seat_id: 30,
            });

        jest
            .spyOn(RefundRepository.prototype, "findByTicketId")
            .mockResolvedValue(null);

        jest
            .spyOn(TicketRepository.prototype, "findTicketWithEventById")
            .mockResolvedValue({
                ticket_id: 10,
                event_location_id: 99,
            });

        jest
            .spyOn(EventLocationRepository.prototype, "findById")
            .mockResolvedValue({
                event_location_id: 99,
                is_refundable: true,
                refundable_until: null,
                refund_policy_code: "FULL",
            });

        jest
            .spyOn(PaymentRepository.prototype, "findById")
            .mockResolvedValue({
                payment_id: 20,
                stripe_payment_intent_id: "pi_123",
            });

        jest
            .spyOn(RefundRepository.prototype, "createRefund")
            .mockResolvedValue({
                refund_id: 500,
                ticket_id: 10,
            });

        stripeRefundsCreate.mockResolvedValue({
            id: "re_123",
            status: "succeeded",
        });

        const updateRefundSpy = jest
            .spyOn(RefundRepository.prototype, "updateStripeInfoAndStatus")
            .mockResolvedValue();

        const updateTicketSpy = jest
            .spyOn(TicketRepository.prototype, "updateStatusAndCheckInAt")
            .mockResolvedValue();

        const updateSeatSpy = jest
            .spyOn(EventSeatRepository.prototype, "updateEventSeatStatus")
            .mockResolvedValue();

        const result = await refundTicketService({
            ticketId: 10,
            attendeeId: 777,
            reason: "I can't attend",
        });

        expect(result.ok).toBe(true);
        expect(result.ticket_id).toBe(10);
        expect(result.amount).toBe(150);

        expect(stripeRefundsCreate).toHaveBeenCalledTimes(1);
        const refundArgs = stripeRefundsCreate.mock.calls[0][0];

        expect(refundArgs.payment_intent).toBe("pi_123");
        expect(refundArgs.amount).toBe(15000);

        expect(updateRefundSpy).toHaveBeenCalled();
        expect(updateTicketSpy).toHaveBeenCalled();
        expect(updateSeatSpy).toHaveBeenCalled();
    });

});
