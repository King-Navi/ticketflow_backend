import { jest } from "@jest/globals";
import EventLocationRepository from "../../repositories/eventLocation.repository.js";

describe("EventLocationRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    };

    repository = new EventLocationRepository(modelMock);
  });

  // findByEventLocationId
  test("findByEventLocationId_LocationExists_ReturnsLocation", async () => {
    const eventLocationId = 1;
    const location = { event_location_id: eventLocationId, venue_name: "Foro Sol" };

    modelMock.findByPk.mockResolvedValue(location);

    const result = await repository.findByEventLocationId(eventLocationId);

    expect(result).toEqual(location);
    expect(modelMock.findByPk).toHaveBeenCalledWith(eventLocationId);
  });

  // findAllLocations
  test("findAllLocations_DefaultOptions_ReturnsResultFromModel", async () => {
    const dbResult = {
      rows: [{ event_location_id: 1 }, { event_location_id: 2 }],
      count: 2,
    };

    modelMock.findAndCountAll.mockResolvedValue(dbResult);

    const result = await repository.findAllLocations();

    expect(result).toBe(dbResult);
    expect(modelMock.findAndCountAll).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      order: [["event_location_id", "ASC"]],
    });
  });

  // search
  test("search_WithCityAndVenueName_ReturnsMatches", async () => {
    const params = {
      city: "CDMX",
      venueName: "Foro Sol",
      limit: 10,
      offset: 5,
    };

    const matches = [
      { event_location_id: 3, city: "CDMX", venue_name: "Foro Sol" },
    ];

    modelMock.findAll.mockResolvedValue(matches);

    const result = await repository.search(params);

    expect(result).toBe(matches);
    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { city: "CDMX", venue_name: "Foro Sol" },
      limit: 10,
      offset: 5,
      order: [["event_location_id", "DESC"]],
    });
  });

  // createEventLocation
  test("createEventLocation_ValidData_ReturnsNewLocationId", async () => {
    const data = {
      venue_name: "Foro Sol",
      address_line1: "Av. Viaducto Río de la Piedad",
      city: "CDMX",
      country: "Mexico",
    };

    const created = {
      event_location_id: 7,
      ...data,
      address_line2: null,
      state: null,
      postal_code: null,
      capacity: null,
    };

    modelMock.create.mockResolvedValue(created);

    const result = await repository.createEventLocation(data);

    expect(result).toBe(7);
    expect(modelMock.create).toHaveBeenCalledWith(
      {
        venue_name: "Foro Sol",
        address_line1: "Av. Viaducto Río de la Piedad",
        address_line2: null,
        city: "CDMX",
        state: null,
        country: "Mexico",
        postal_code: null,
        capacity: null,
      },
      { transaction: undefined }
    );
  });

  // findById
  test("findById_ValidId_ReturnsPlainLocation", async () => {
    const eventLocationId = 5;

    const instance = {
      get: jest.fn().mockReturnValue({
        event_location_id: eventLocationId,
        venue_name: "Auditorio Nacional",
        city: "CDMX",
      }),
    };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.findById(eventLocationId);

    expect(modelMock.findByPk).toHaveBeenCalledWith(eventLocationId, {
      transaction: undefined,
    });
    expect(result).toEqual({
      event_location_id: eventLocationId,
      venue_name: "Auditorio Nacional",
      city: "CDMX",
    });
  });
});
