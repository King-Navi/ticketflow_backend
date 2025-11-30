// ticket.repository.test.js
import { jest } from "@jest/globals";
import { Sequelize, QueryTypes } from "sequelize";
import TicketRepository from "../../repositories/ticket.repository.js";
import { TICKET_STATUS } from "../../model_db/utils/ticketStatus.js";

describe("TicketRepository (one test per function)", () => {
  let modelMock;
  let sequelizeMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      findByPk: jest.fn(),
    };

    sequelizeMock = {
      query: jest.fn(),
    };

    repository = new TicketRepository(modelMock, sequelizeMock);
  });

  // findByEventSeatId
  test("findByEventSeatId_ValidId_ReturnsPlainTicket", async () => {
    const eventSeatId = 10;
    const plain = {
      ticket_id: 1,
      event_seat_id: eventSeatId,
      ticket_status_id: TICKET_STATUS.SOLD,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findByEventSeatId(eventSeatId);

    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { event_seat_id: eventSeatId },
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });

  // findAllByEventSeatId
  test("findAllByEventSeatId_ValidId_ReturnsPlainArray", async () => {
    const eventSeatId = 20;

    const plain1 = { ticket_id: 1, event_seat_id: eventSeatId };
    const plain2 = { ticket_id: 2, event_seat_id: eventSeatId };

    const row1 = { get: jest.fn().mockReturnValue(plain1) };
    const row2 = { get: jest.fn().mockReturnValue(plain2) };

    modelMock.findAll.mockResolvedValue([row1, row2]);

    const result = await repository.findAllByEventSeatId(eventSeatId);

    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { event_seat_id: eventSeatId },
      transaction: undefined,
    });
    expect(result).toEqual([plain1, plain2]);
  });

  // isBlockingStatus
  test("isBlockingStatus_SoldStatus_ReturnsTrue", () => {
    const result = repository.isBlockingStatus(TICKET_STATUS.SOLD);
    expect(result).toBe(true);
  });

  // isReleasingStatus
  test("isReleasingStatus_RefundedStatus_ReturnsTrue", () => {
    const result = repository.isReleasingStatus(TICKET_STATUS.REFUNDED);
    expect(result).toBe(true);
  });

  // createTicketFromSeat
  test("createTicketFromSeat_ValidData_ReturnsTicketInfo", async () => {
    const data = {
      payment_id: 1,
      event_seat_id: 100,
      unit_price: 500,
      category_label: "VIP",
      seat_label: "A-10",
    };

    const rows = [
      {
        out_ticket_id: 7,
        out_ticket_qr_id: 15,
        out_token: "token123",
        out_reissued: false,
      },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.createTicketFromSeat(data);

    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);
    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        type: QueryTypes.SELECT,
        transaction: undefined,
        replacements: {
          eventSeatId: data.event_seat_id,
          paymentId: data.payment_id,
          categoryLabel: data.category_label,
          seatLabel: data.seat_label,
          unitPrice: data.unit_price,
        },
      })
    );

    expect(result).toEqual({
      ticket_id: 7,
      ticket_qr_id: 15,
      token: "token123",
      reissued: false,
    });
  });

  // findTicketWithEventById
  test("findTicketWithEventById_ValidId_ReturnsRow", async () => {
    const ticketId = 5;

    const rows = [
      {
        ticket_id: ticketId,
        event_id: 1,
        event_name: "Rock Fest",
      },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.findTicketWithEventById(ticketId);

    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);
    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        type: QueryTypes.SELECT,
        transaction: undefined,
        replacements: { ticketId },
      })
    );

    expect(result).toEqual(rows[0]);
  });

  // updateStatusAndCheckInAt
  test("updateStatusAndCheckInAt_ValidData_ReturnsPlainTicket", async () => {
    const ticketId = 9;
    const ticketStatusId = TICKET_STATUS.CHECKED_IN;
    const checkInAt = new Date("2025-01-01T10:00:00Z");

    modelMock.update.mockResolvedValue([1]);

    const plain = {
      ticket_id: ticketId,
      ticket_status_id: ticketStatusId,
      checked_in_at: checkInAt,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.updateStatusAndCheckInAt(
      ticketId,
      ticketStatusId,
      checkInAt
    );

    expect(modelMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket_status_id: ticketStatusId,
        updated_at: expect.any(Date),
        checked_in_at: checkInAt,
      }),
      {
        where: { ticket_id: ticketId },
        transaction: undefined,
      }
    );

    expect(modelMock.findByPk).toHaveBeenCalledWith(ticketId, {
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });

  // findByIdAndAttendee
  test("findByIdAndAttendee_ValidIds_ReturnsRow", async () => {
    const ticketId = 11;
    const attendeeId = 3;

    const rows = [
      {
        ticket_id: ticketId,
        payment_id: 50,
        attendee_id: attendeeId,
      },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.findByIdAndAttendee(ticketId, attendeeId);

    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);
    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        type: QueryTypes.SELECT,
        transaction: undefined,
        replacements: { ticketId, attendeeId },
      })
    );

    expect(result).toEqual(rows[0]);
  });

  // findEventsWithTicketsByAttendee
  test("findEventsWithTicketsByAttendee_ValidAttendee_ReturnsRows", async () => {
    const attendeeId = 4;
    const rows = [
      { event_id: 1, attendee_id: attendeeId },
      { event_id: 2, attendee_id: attendeeId },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.findEventsWithTicketsByAttendee(attendeeId);

    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);
    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        type: QueryTypes.SELECT,
        transaction: undefined,
        replacements: {
          attendeeId,
          eventStatusCode: null,
        },
      })
    );

    expect(result).toBe(rows);
  });
});
