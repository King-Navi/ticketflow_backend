import { jest } from "@jest/globals";
import EventSeatRepository from "../../repositories/eventSeat.repository.js";

describe("EventSeatRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      bulkCreate: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
    };

    repository = new EventSeatRepository({ EventSeat: modelMock });
  });

  // createEventSeat
  test("createEventSeat_ValidData_ReturnsNewEventSeatId", async () => {
    const data = {
      event_id: 1,
      seat_id: 10,
      base_price: 500,
      event_seat_status_id: 1,
    };

    const created = { event_seat_id: 99, ...data };
    modelMock.create.mockResolvedValue(created);

    const result = await repository.createEventSeat(data);

    expect(result).toBe(99);
    expect(modelMock.create).toHaveBeenCalledWith(
      {
        event_id: 1,
        seat_id: 10,
        base_price: 500,
        event_seat_status_id: 1,
      },
      { transaction: undefined }
    );
  });

  // bulkCreateEventSeats
  test("bulkCreateEventSeats_ValidItems_ReturnsInsertedCount", async () => {
    const eventId = 2;
    const items = [
      { seat_id: 1, base_price: 100, event_seat_status_id: 1 },
      { seat_id: 2, base_price: 120, event_seat_status_id: 1 },
    ];

    modelMock.bulkCreate.mockResolvedValue(undefined);

    const result = await repository.bulkCreateEventSeats(eventId, items);

    expect(result).toBe(2);
    expect(modelMock.bulkCreate).toHaveBeenCalledWith(
      [
        { event_id: 2, seat_id: 1, base_price: 100, event_seat_status_id: 1 },
        { event_id: 2, seat_id: 2, base_price: 120, event_seat_status_id: 1 },
      ],
      {
        transaction: undefined,
        validate: true,
        returning: false,
      }
    );
  });

  // findById
  test("findById_ValidId_ReturnsEventSeatInstance", async () => {
    const eventSeatId = 5;
    const instance = { event_seat_id: eventSeatId };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.findById(eventSeatId);

    expect(result).toBe(instance);
    expect(modelMock.findByPk).toHaveBeenCalledWith(eventSeatId, {
      transaction: undefined,
    });
  });

  // ensureEventSeatBelongsToEvent
  test("ensureEventSeatBelongsToEvent_SeatBelongs_ReturnsPlainSeat", async () => {
    const eventId = 42;
    const eventSeatId = 100;

    const plain = {
      event_seat_id: eventSeatId,
      event_id: eventId,
      base_price: 200,
    };

    const instance = {
      event_id: eventId,
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.ensureEventSeatBelongsToEvent(
      eventId,
      eventSeatId
    );

    expect(modelMock.findByPk).toHaveBeenCalledWith(eventSeatId, {
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });

  // updateEventSeatStatus
  test("updateEventSeatStatus_ValidUpdate_ReturnsPlainSeat", async () => {
    const eventSeatId = 7;
    const newStatusId = 3;

    const plain = {
      event_seat_id: eventSeatId,
      event_seat_status_id: newStatusId,
    };

    const instance = {
      event_seat_id: eventSeatId,
      event_seat_status_id: 1,
      save: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.updateEventSeatStatus(
      eventSeatId,
      newStatusId
    );

    expect(modelMock.findByPk).toHaveBeenCalledWith(eventSeatId, {
      transaction: undefined,
    });
    expect(instance.save).toHaveBeenCalledWith({ transaction: undefined });
    expect(result).toEqual(plain);
  });

  // findAllByEventId
  test("findAllByEventId_ValidEventId_ReturnsPlainArray", async () => {
    const eventId = 10;

    const row1 = {
      get: jest.fn().mockReturnValue({
        event_seat_id: 1,
        event_id: eventId,
        base_price: 100,
      }),
    };
    const row2 = {
      get: jest.fn().mockReturnValue({
        event_seat_id: 2,
        event_id: eventId,
        base_price: 120,
      }),
    };

    modelMock.findAll.mockResolvedValue([row1, row2]);

    const result = await repository.findAllByEventId(eventId);

    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { event_id: eventId },
      order: [["event_seat_id", "ASC"]],
      transaction: undefined,
    });

    expect(result).toEqual([
      { event_seat_id: 1, event_id: eventId, base_price: 100 },
      { event_seat_id: 2, event_id: eventId, base_price: 120 },
    ]);
  });
});
