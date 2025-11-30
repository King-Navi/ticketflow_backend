import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import ReservationRepository from "../../repositories/reservation.repository.js";

const { Op } = Sequelize;

describe("ReservationRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    repository = new ReservationRepository(modelMock);
  });

  test("findActiveNotExpiredByEventSeatId_ValidActiveNotExpired_ReturnsPlainReservation", async () => {
    const eventSeatId = 10;
    const futureDate = new Date(Date.now() + 60 * 1000);

    const plain = {
      reservation_id: 1,
      event_seat_id: eventSeatId,
      status: "active",
      expiration_at: futureDate,
    };

    const instance = {
      expiration_at: futureDate,
      get: jest.fn().mockReturnValue(plain),
      update: jest.fn(),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findActiveNotExpiredByEventSeatId(eventSeatId);

    expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    const args = modelMock.findOne.mock.calls[0][0];
    expect(args.where.event_seat_id).toBe(eventSeatId);
    expect(args.where.status).toBe("active");
    expect(args.where.expiration_at[Op.gt]).toBeInstanceOf(Date);
    expect(args.transaction).toBeUndefined();

    expect(result).toEqual(plain);
    expect(instance.update).not.toHaveBeenCalled();
  });

  test("findActiveNotExpiredBySeatAndAttendee_ValidReservation_ReturnsPlainReservation", async () => {
    const eventSeatId = 20;
    const attendeeId = 3;
    const futureDate = new Date(Date.now() + 5 * 60 * 1000);

    const plain = {
      reservation_id: 2,
      event_seat_id: eventSeatId,
      attendee_id: attendeeId,
      status: "active",
      expiration_at: futureDate,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findActiveNotExpiredBySeatAndAttendee(
      eventSeatId,
      attendeeId
    );

    expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    const args = modelMock.findOne.mock.calls[0][0];
    expect(args.where.event_seat_id).toBe(eventSeatId);
    expect(args.where.attendee_id).toBe(attendeeId);
    expect(args.where.status).toBe("active");
    expect(args.where.expiration_at[Op.gt]).toBeInstanceOf(Date);
    expect(result).toEqual(plain);
  });

  test("createReservation_ValidData_ReturnsPlainReservation", async () => {
    const data = {
      attendee_id: 5,
      event_seat_id: 99,
      expiration_at: new Date("2025-01-01T00:00:00Z"),
    };

    const plain = {
      reservation_id: 7,
      ...data,
      status: "active",
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.create.mockResolvedValue(instance);

    const result = await repository.createReservation(data);

    expect(modelMock.create).toHaveBeenCalledWith(
      {
        attendee_id: 5,
        event_seat_id: 99,
        expiration_at: data.expiration_at,
        status: "active",
      },
      { transaction: undefined }
    );
    expect(result).toEqual(plain);
  });

  test("markExpired_ValidId_ReturnsTrue", async () => {
    const reservationId = 15;
    modelMock.update.mockResolvedValue([1]);

    const result = await repository.markExpired(reservationId);

    expect(result).toBe(true);
    expect(modelMock.update).toHaveBeenCalledWith(
      {
        status: "expired",
        updated_at: expect.any(Date),
      },
      {
        where: { reservation_id: reservationId },
        transaction: undefined,
      }
    );
  });

  test("markConverted_ValidId_ReturnsTrue", async () => {
    const reservationId = 16;
    modelMock.update.mockResolvedValue([1]);

    const result = await repository.markConverted(reservationId);

    expect(result).toBe(true);
    const args = modelMock.update.mock.calls[0][0];
    expect(args.status).toBeDefined(); // el valor real viene de RESERVATION_STATUS.CONVERTED
    expect(args.updated_at).toBeInstanceOf(Date);
    expect(modelMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: args.status,
        updated_at: expect.any(Date),
      }),
      {
        where: { reservation_id: reservationId },
        transaction: undefined,
      }
    );
  });
});
