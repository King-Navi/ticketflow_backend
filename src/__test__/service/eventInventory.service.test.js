import { jest } from "@jest/globals";

import EventRepository from "../../repositories/event.repository.js";
import EventSeatRepository from "../../repositories/eventSeat.repository.js";
import EventSeatStatusRepository from "../../repositories/eventSeatStatus.repository.js";
import SeatRepository from "../../repositories/seat.repository.js";

import { createEventWithInventoryService } from "../../service/eventInventory.service.js";

describe("createEventWithInventoryService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("createEventWithInventoryService_ValidPayload_CreatesEventAndInventory", async () => {
    const payload = {
      event: {
        event_name: "Big Concert",
        category: "music",
        description: "Live show",
        event_date: "2025-12-01",
        start_time: "20:00:00",
        end_time: "22:00:00",
        company_id: 1,
        event_location_id: 5,
      },
      inventory: [
        { seat_id: 101, base_price: 500, status: "available" },
        { seat_id: 102, base_price: 600, status: "reserved" },
      ],
    };

    const externalTx = { id: "tx-1" }; // cualquier objeto, solo para pasar el branch de externalTx

    // seatRepo: todos los asientos son válidos para esa location
    const validSeatsSpy = jest
      .spyOn(SeatRepository.prototype, "findValidSeatIdsForEventLocation")
      .mockResolvedValue([101, 102]);

    // eventRepo: no hay solapamiento y el evento se crea
    const overlapSpy = jest
      .spyOn(EventRepository.prototype, "findOverlappingEvent")
      .mockResolvedValue(null);

    const createEventSpy = jest
      .spyOn(EventRepository.prototype, "createEvent")
      .mockResolvedValue(77); // event_id

    // statusRepo: mapear "available" y "reserved" a IDs
    const statusSpy = jest
      .spyOn(EventSeatStatusRepository.prototype, "findByName")
      .mockImplementation(async (name) => {
        if (name === "available") return { event_seat_status_id: 1 };
        if (name === "reserved") return { event_seat_status_id: 2 };
        return null;
      });

    // eventSeatRepo: crear cada asiento de inventario
    const createSeatSpy = jest
      .spyOn(EventSeatRepository.prototype, "createEventSeat")
      .mockResolvedValueOnce(1001) // para seat 101
      .mockResolvedValueOnce(1002); // para seat 102

    const result = await createEventWithInventoryService(payload, {
      transaction: externalTx,
    });

    // Validación de llamada a seats válidos
    expect(validSeatsSpy).toHaveBeenCalledWith(
      5,
      [101, 102],
      { transaction: externalTx }
    );

    // Validación de overlap
    expect(overlapSpy).toHaveBeenCalledWith({
      event_location_id: 5,
      event_date: "2025-12-01",
      start_time: "20:00:00",
      end_time: "22:00:00",
    });

    // Evento creado
    expect(createEventSpy).toHaveBeenCalledWith(payload.event, {
      transaction: externalTx,
    });

    // Statuses resueltos
    expect(statusSpy).toHaveBeenCalledTimes(2);
    expect(statusSpy).toHaveBeenCalledWith("available");
    expect(statusSpy).toHaveBeenCalledWith("reserved");

    // Creación de event_seat
    expect(createSeatSpy).toHaveBeenNthCalledWith(
      1,
      {
        event_id: 77,
        seat_id: 101,
        base_price: 500,
        event_seat_status_id: 1,
      },
      { transaction: externalTx }
    );
    expect(createSeatSpy).toHaveBeenNthCalledWith(
      2,
      {
        event_id: 77,
        seat_id: 102,
        base_price: 600,
        event_seat_status_id: 2,
      },
      { transaction: externalTx }
    );

    // Resultado final
    expect(result).toEqual({
      event_id: 77,
      event_location_id: 5,
      inventory_created: [
        {
          event_seat_id: 1001,
          seat_id: 101,
          base_price: 500,
          status: "available",
        },
        {
          event_seat_id: 1002,
          seat_id: 102,
          base_price: 600,
          status: "reserved",
        },
      ],
      counts: { requested: 2, created: 2 },
    });
  });
});
