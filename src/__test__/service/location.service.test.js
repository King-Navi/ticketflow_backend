import { jest } from "@jest/globals";

import SectionRepository from "../../repositories/section.repository.js";
import SeatRepository from "../../repositories/seat.repository.js";
import EventLocationRepository from "../../repositories/eventLocation.repository.js";

import {
  newEventLocationService,
  newSectionService,
  newSeatService,
  newSeatsBulkService,
  listAllLocationsService,
  recoverEventLocationLayoutService,
} from "../../service/location.service.js";

describe("Venue layout services", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // newEventLocationService
  test("newEventLocationService_ValidPayload_CreatesEventLocation", async () => {
    const payload = {
      venue_name: "Teatro Aurora",
      address_line1: "Av. Central 123",
      city: "CDMX",
      country: "MX",
      address_line2: "Piso 2",
      state: "CDMX",
      postal_code: "01234",
      capacity: 1200,
    };

    const createSpy = jest
      .spyOn(EventLocationRepository.prototype, "createEventLocation")
      .mockResolvedValue(10);

    const result = await newEventLocationService(payload);

    expect(createSpy).toHaveBeenCalledWith({
      venue_name: "Teatro Aurora",
      address_line1: "Av. Central 123",
      address_line2: "Piso 2",
      city: "CDMX",
      state: "CDMX",
      country: "MX",
      postal_code: "01234",
      capacity: 1200,
    });

    expect(result).toEqual({ event_location_id: 10 });
  });

  // newSectionService
  test("newSectionService_ValidPayload_CreatesSection", async () => {
    const payload = {
      section_name: "Platea A",
      event_location_id: 42,
    };

    const findLocationSpy = jest
      .spyOn(EventLocationRepository.prototype, "findByEventLocationId")
      .mockResolvedValue({ event_location_id: 42 });

    const createSectionSpy = jest
      .spyOn(SectionRepository.prototype, "createSection")
      .mockResolvedValue(7);

    const result = await newSectionService(payload);

    expect(findLocationSpy).toHaveBeenCalledWith(42);
    expect(createSectionSpy).toHaveBeenCalledWith({
      section_name: "Platea A",
      event_location_id: 42,
    });

    expect(result).toEqual({ section_id: 7 });
  });

  // newSeatService
  test("newSeatService_ValidPayload_CreatesSeat", async () => {
    const payload = {
      seat_no: "12",
      row_no: "B",
      section_id: 7,
    };

    const findSectionSpy = jest
      .spyOn(SectionRepository.prototype, "findById")
      .mockResolvedValue({ section_id: 7 });

    const createSeatSpy = jest
      .spyOn(SeatRepository.prototype, "createSeat")
      .mockResolvedValue(100);

    const result = await newSeatService(payload);

    expect(findSectionSpy).toHaveBeenCalledWith(7);
    expect(createSeatSpy).toHaveBeenCalledWith({
      seat_no: "12",
      row_no: "B",
      section_id: 7,
    });

    expect(result).toEqual({ seat_id: 100 });
  });

  // newSeatsBulkService
  test("newSeatsBulkService_ValidInput_CreatesMultipleSeats", async () => {
    const sectionId = 7;
    const seats = [
      { seat_no: "1", row_no: "A" },
      { seat_no: "2", row_no: "A" },
      { seat_no: "3", row_no: "A" },
    ];

    const findSectionSpy = jest
      .spyOn(SectionRepository.prototype, "findById")
      .mockResolvedValue({ section_id: sectionId });

    const bulkSpy = jest
      .spyOn(SeatRepository.prototype, "bulkCreateSeats")
      .mockResolvedValue(seats.length);

    const result = await newSeatsBulkService(sectionId, seats);

    expect(findSectionSpy).toHaveBeenCalledWith(sectionId);
    expect(bulkSpy).toHaveBeenCalledWith(
      [
        { seat_no: "1", row_no: "A", section_id: sectionId },
        { seat_no: "2", row_no: "A", section_id: sectionId },
        { seat_no: "3", row_no: "A", section_id: sectionId },
      ]
    );
    expect(result).toEqual({ created: 3 });
  });

  // listAllLocationsService
  test("listAllLocationsService_ValidOptions_DelegatesToRepository", async () => {
    const repoResult = {
      rows: [{ event_location_id: 1 }, { event_location_id: 2 }],
      count: 2,
    };

    const findAllSpy = jest
      .spyOn(EventLocationRepository.prototype, "findAllLocations")
      .mockResolvedValue(repoResult);

    const result = await listAllLocationsService({ limit: 10, offset: 5 });

    expect(findAllSpy).toHaveBeenCalledWith({ limit: 10, offset: 5 });
    expect(result).toBe(repoResult);
  });

  // recoverEventLocationLayoutService
  test("recoverEventLocationLayoutService_ValidId_ReturnsLayout", async () => {
    const locId = 5;

    const location = {
      event_location_id: locId,
      venue_name: "Teatro Aurora",
      address_line1: "Av. Central 123",
      address_line2: "Piso 2",
      city: "CDMX",
      state: "CDMX",
      country: "MX",
      postal_code: "01234",
      capacity: 1200,
      created_at: new Date("2025-01-01T10:00:00Z"),
      updated_at: new Date("2025-01-02T10:00:00Z"),
    };

    const sectionsRaw = [
      {
        section_id: 1,
        section_name: "Platea A",
        event_location_id: locId,
        created_at: new Date("2025-01-01T11:00:00Z"),
        updated_at: new Date("2025-01-01T12:00:00Z"),
      },
    ];

    const seatsRaw = [
      {
        seat_id: 10,
        row_no: "A",
        seat_no: "1",
        section_id: 1,
        created_at: new Date("2025-01-01T11:30:00Z"),
        updated_at: new Date("2025-01-01T11:40:00Z"),
      },
      {
        seat_id: 11,
        row_no: "A",
        seat_no: "2",
        section_id: 1,
        created_at: new Date("2025-01-01T11:31:00Z"),
        updated_at: new Date("2025-01-01T11:41:00Z"),
      },
    ];

    const findLocationSpy = jest
      .spyOn(EventLocationRepository.prototype, "findByEventLocationId")
      .mockResolvedValue(location);

    const findSectionsSpy = jest
      .spyOn(SectionRepository.prototype, "findAllByEventLocationId")
      .mockResolvedValue(sectionsRaw);

    const findSeatsSpy = jest
      .spyOn(SeatRepository.prototype, "findAllBySectionId")
      .mockResolvedValue(seatsRaw);

    const result = await recoverEventLocationLayoutService(locId);

    expect(findLocationSpy).toHaveBeenCalledWith(locId);
    expect(findSectionsSpy).toHaveBeenCalledWith(locId);
    expect(findSeatsSpy).toHaveBeenCalledWith(1);

    expect(result).toEqual({
      event_location_id: locId,
      venue_name: "Teatro Aurora",
      address: {
        address_line1: "Av. Central 123",
        address_line2: "Piso 2",
        city: "CDMX",
        state: "CDMX",
        country: "MX",
        postal_code: "01234",
      },
      capacity: 1200,
      sections: [
        {
          section_id: 1,
          section_name: "Platea A",
          created_at: sectionsRaw[0].created_at,
          updated_at: sectionsRaw[0].updated_at,
          seats: [
            {
              seat_id: 10,
              row_no: "A",
              seat_no: "1",
              display_label: "A-1",
              created_at: seatsRaw[0].created_at,
              updated_at: seatsRaw[0].updated_at,
            },
            {
              seat_id: 11,
              row_no: "A",
              seat_no: "2",
              display_label: "A-2",
              created_at: seatsRaw[1].created_at,
              updated_at: seatsRaw[1].updated_at,
            },
          ],
        },
      ],
      metadata: {
        created_at: location.created_at,
        updated_at: location.updated_at,
      },
    });
  });
});
