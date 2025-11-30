import { jest } from "@jest/globals";

import EventRepository from "../../repositories/event.repository.js";
import EventSeatRepository from "../../repositories/eventSeat.repository.js";
import { getEventSeatsByEventIdService } from "../../service/eventSeat.service.js"; // <-- ajusta la ruta/nombre

describe("getEventSeatsByEventIdService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getEventSeatsByEventIdService_ValidEventId_ReturnsSeatsAndCount", async () => {
    const eventId = 5;

    const eventRow = { event_id: eventId, event_name: "My Event" };
    const seats = [
      { event_seat_id: 1, event_id: eventId, seat_id: 101, base_price: 500 },
      { event_seat_id: 2, event_id: eventId, seat_id: 102, base_price: 600 },
    ];

    const findEventSpy = jest
      .spyOn(EventRepository.prototype, "findById")
      .mockResolvedValue(eventRow);

    const findSeatsSpy = jest
      .spyOn(EventSeatRepository.prototype, "findAllByEventId")
      .mockResolvedValue(seats);

    const result = await getEventSeatsByEventIdService(eventId);

    expect(findEventSpy).toHaveBeenCalledWith(eventId);
    expect(findSeatsSpy).toHaveBeenCalledWith(eventId, { transaction: undefined });

    expect(result).toEqual({
      event_id: eventId,
      count: seats.length,
      seats,
    });
  });
});
