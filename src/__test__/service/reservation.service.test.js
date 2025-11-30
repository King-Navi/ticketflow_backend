import { jest } from "@jest/globals";
import { sequelizeCon } from "../../config/initPostgre.js";

import EventRepository from "../../repositories/event.repository.js";
import EventSeatRepository from "../../repositories/eventSeat.repository.js";
import ReservationRepository from "../../repositories/reservation.repository.js";
import TicketRepository from "../../repositories/ticket.repository.js";

import { EVENT_SEAT_STATUS } from "../../model_db/utils/eventSeatStatus.js";
import { BadRequest, Conflict } from "../../utils/errors/error.400.js";

import { createReservationService } from "../../service/reservation.service.js";
describe("createReservationService", () => {
    const tx = { id: "tx-1" };

    beforeEach(() => {
        jest.spyOn(sequelizeCon, "transaction").mockImplementation(async (cb) => cb(tx));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("createReservationService_ValidSingleSeat_CreatesReservationAndUpdatesSeat", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        const fakeEvent = { event_id, event_status_id: 999 };
        const fakeSeat = {
            event_seat_id: event_seat_id,
            event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE,
        };
        const fakeReservation = {
            reservation_id: 1,
            attendee_id,
            event_seat_id,
            expiration_at: new Date(),
        };
        const updatedSeat = {
            event_seat_id,
            event_seat_status_id: EVENT_SEAT_STATUS.RESERVED,
        };

        const ensureOnSaleSpy = jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue(fakeEvent);

        const ensureSeatSpy = jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue(fakeSeat);

        const findActiveReservationSpy = jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(null);

        const findTicketSpy = jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(null);

        const createReservationSpy = jest
            .spyOn(ReservationRepository.prototype, "createReservation")
            .mockResolvedValue(fakeReservation);

        const updateSeatStatusSpy = jest
            .spyOn(EventSeatRepository.prototype, "updateEventSeatStatus")
            .mockResolvedValue(updatedSeat);

        const result = await createReservationService(
            event_id,
            attendee_id,
            event_seat_id,
            null
        );

        expect(sequelizeCon.transaction).toHaveBeenCalledTimes(1);

        expect(ensureOnSaleSpy).toHaveBeenCalledWith(event_id, { transaction: tx });
        expect(ensureSeatSpy).toHaveBeenCalledWith(event_id, event_seat_id, {
            transaction: tx,
        });
        expect(findActiveReservationSpy).toHaveBeenCalledWith(event_seat_id, {
            transaction: tx,
        });
        expect(findTicketSpy).toHaveBeenCalledWith(event_seat_id, {
            transaction: tx,
        });

        expect(createReservationSpy).toHaveBeenCalledTimes(1);
        const [reservationPayload] = createReservationSpy.mock.calls[0];
        expect(reservationPayload.attendee_id).toBe(attendee_id);
        expect(reservationPayload.event_seat_id).toBe(event_seat_id);
        expect(reservationPayload.expiration_at).toBeInstanceOf(Date);

        expect(updateSeatStatusSpy).toHaveBeenCalledWith(
            event_seat_id,
            EVENT_SEAT_STATUS.RESERVED,
            { transaction: tx }
        );

        expect(result).toEqual({
            event: fakeEvent,
            reservations: [fakeReservation],
            eventSeats: [updatedSeat],
        });
    });

    test("createReservationService_EventSeatAlreadyReservedByOther_ThrowsConflict", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({ event_id });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE,
            });

        const existingReservation = {
            reservation_id: 99,
            attendee_id: 999,
            event_seat_id,
            expiration_at: new Date(Date.now() + 600000),
        };

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(existingReservation);

        jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(null);

        await expect(
            createReservationService(event_id, attendee_id, event_seat_id, null)
        ).rejects.toThrow(Conflict);

        // opcional valida mensaje y meta
        try {
            await createReservationService(event_id, attendee_id, event_seat_id, null);
        } catch (err) {
            expect(err.message).toBe(
                "This seat is already reserved by someone else."
            );
            expect(err.meta).toEqual({
                reservation_id: existingReservation.reservation_id,
                expires_at: existingReservation.expiration_at,
                reserved_by_attendee_id: existingReservation.attendee_id,
                current_attendee_id: attendee_id,
                event_seat_id,
            });
        }
    });

    test("createReservationService_EventSeatHasBlockingTicket_ThrowsConflict", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({ event_id });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE,
            });

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(null);

        const blockingTicket = {
            ticket_id: 555,
            ticket_status_id: 2, //  blocking por isBlockingStatus
        };

        jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(blockingTicket);

        // dejamos isBlockingStatus real
        await expect(
            createReservationService(event_id, attendee_id, event_seat_id, null)
        ).rejects.toThrow(Conflict);

        try {
            await createReservationService(event_id, attendee_id, event_seat_id, null);
        } catch (err) {
            expect(err.message).toBe(
                "This seat already has a sold/checked-in ticket."
            );
            expect(err.meta).toEqual({
                ticket_id: blockingTicket.ticket_id,
                ticket_status_id: blockingTicket.ticket_status_id,
                event_seat_id,
            });
        }
    });

    test("createReservationService_SeatReservedWithoutActiveReservation_ResetsToAvailableAndThenReserves", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({ event_id });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: EVENT_SEAT_STATUS.RESERVED,
            });

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(null);

        jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(null);

        jest
            .spyOn(ReservationRepository.prototype, "createReservation")
            .mockResolvedValue({
                reservation_id: 1,
                attendee_id,
                event_seat_id,
                expiration_at: new Date(),
            });

        const updateSeatStatusSpy = jest
            .spyOn(EventSeatRepository.prototype, "updateEventSeatStatus")
            .mockImplementationOnce(async (id, status) => ({
                event_seat_id: id,
                event_seat_status_id: status,
            }))
            .mockImplementationOnce(async (id, status) => ({
                event_seat_id: id,
                event_seat_status_id: status,
            }));

        await createReservationService(event_id, attendee_id, event_seat_id, null);

        expect(updateSeatStatusSpy).toHaveBeenCalledTimes(2);

        expect(updateSeatStatusSpy).toHaveBeenNthCalledWith(
            1,
            event_seat_id,
            EVENT_SEAT_STATUS.AVAILABLE,
            { transaction: tx }
        );
        expect(updateSeatStatusSpy).toHaveBeenNthCalledWith(
            2,
            event_seat_id,
            EVENT_SEAT_STATUS.RESERVED,
            { transaction: tx }
        );
    });

    test("createReservationService_SeatInNonAvailableStatus_ThrowsConflict", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({ event_id });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: 9999, // distinto de AVAILABLE y RESERVED
            });

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(null);

        jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(null);

        await expect(
            createReservationService(event_id, attendee_id, event_seat_id, null)
        ).rejects.toThrow(Conflict);

        try {
            await createReservationService(event_id, attendee_id, event_seat_id, null);
        } catch (err) {
            expect(err.message).toBe("This seat is not available for reservation.");
            expect(err.meta).toEqual({
                current_status_id: 9999,
                allowed_status_id: EVENT_SEAT_STATUS.AVAILABLE,
                event_seat_id,
            });
        }
    });

    test("createReservationService_MissingEventId_ThrowsBadRequest", async () => {
        await expect(
            createReservationService(null, 1, 2, null)
        ).rejects.toThrow(BadRequest);
        await expect(
            createReservationService(null, 1, 2, null)
        ).rejects.toThrow("event_id is required.");
    });

    test("createReservationService_ExpirationCappedToMaxWindow", async () => {
        const event_id = 10;
        const attendee_id = 20;
        const event_seat_id = 30;

        jest
            .spyOn(EventRepository.prototype, "ensureEventIsOnSale")
            .mockResolvedValue({ event_id });

        jest
            .spyOn(EventSeatRepository.prototype, "ensureEventSeatBelongsToEvent")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: EVENT_SEAT_STATUS.AVAILABLE,
            });

        jest
            .spyOn(ReservationRepository.prototype, "findActiveNotExpiredByEventSeatId")
            .mockResolvedValue(null);

        jest
            .spyOn(TicketRepository.prototype, "findByEventSeatId")
            .mockResolvedValue(null);

        const createReservationSpy = jest
            .spyOn(ReservationRepository.prototype, "createReservation")
            .mockResolvedValue({
                reservation_id: 1,
                attendee_id,
                event_seat_id,
                expiration_at: new Date(),
            });

        const updateSeatStatusSpy = jest
            .spyOn(EventSeatRepository.prototype, "updateEventSeatStatus")
            .mockResolvedValue({
                event_seat_id,
                event_seat_status_id: EVENT_SEAT_STATUS.RESERVED,
            });

        const futureExpiration = new Date(Date.now() + 1000 * 60 * 60); // 1h

        const beforeCall = Date.now();
        await createReservationService(
            event_id,
            attendee_id,
            event_seat_id,
            futureExpiration
        );
        const afterCall = Date.now();

        const [payload] = createReservationSpy.mock.calls[0];
        const exp = payload.expiration_at.getTime();

        // Debe estar entre now y now + 15 min aprox
        const fifteenMinutes = 15 * 60 * 1000;
        expect(exp).toBeGreaterThanOrEqual(beforeCall);
        expect(exp).toBeLessThanOrEqual(afterCall + fifteenMinutes);
        expect(updateSeatStatusSpy).toHaveBeenCalledWith(
            event_seat_id,
            EVENT_SEAT_STATUS.RESERVED,
            { transaction: tx }
        );
    });
});
