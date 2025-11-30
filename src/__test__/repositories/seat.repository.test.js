import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import SeatRepository from "../../repositories/seat.repository.js";

describe("SeatRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
      sequelize: {
        query: jest.fn(),
      },
    };

    repository = new SeatRepository(modelMock);
  });

  // createSeat
  test("createSeat_ValidData_ReturnsSeatId", async () => {
    const data = {
      seat_no: "1",
      row_no: "A",
      section_id: 10,
    };

    const created = {
      seat_id: 99,
      ...data,
    };

    modelMock.create.mockResolvedValue(created);

    const result = await repository.createSeat(data);

    expect(result).toBe(99);
    expect(modelMock.create).toHaveBeenCalledWith(
      {
        seat_no: "1",
        row_no: "A",
        section_id: 10,
      },
      { transaction: undefined }
    );
  });

  // bulkCreateSeats
  test("bulkCreateSeats_ValidItems_ReturnsInsertedCount", async () => {
    const items = [
      { seat_no: "1", row_no: "A", section_id: 10 },
      { seat_no: "2", row_no: "A", section_id: 10 },
    ];

    modelMock.bulkCreate.mockResolvedValue(undefined);

    const result = await repository.bulkCreateSeats(items);

    expect(result).toBe(2);
    expect(modelMock.bulkCreate).toHaveBeenCalledWith(items, {
      transaction: undefined,
      validate: true,
      returning: false,
    });
  });

  // findAllBySectionId
  test("findAllBySectionId_ValidSectionId_ReturnsSeats", async () => {
    const sectionId = 10;
    const seats = [
      {
        seat_id: 1,
        row_no: "A",
        seat_no: "1",
        section_id: sectionId,
      },
      {
        seat_id: 2,
        row_no: "A",
        seat_no: "2",
        section_id: sectionId,
      },
    ];

    modelMock.findAll.mockResolvedValue(seats);

    const result = await repository.findAllBySectionId(sectionId);

    expect(result).toBe(seats);
    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { section_id: sectionId },
      attributes: [
        "seat_id",
        "row_no",
        "seat_no",
        "section_id",
        "created_at",
        "updated_at",
      ],
      order: [
        ["row_no", "ASC"],
        ["seat_no", "ASC"],
      ],
    });
  });

  // findValidSeatIdsForEventLocation
  test("findValidSeatIdsForEventLocation_ValidInputs_ReturnsSeatIds", async () => {
    const eventLocationId = 5;
    const seatIds = [1, 2, 3];

    const rows = [
      { seat_id: 1 },
      { seat_id: 3 },
    ];

    modelMock.sequelize.query.mockResolvedValue(rows);

    const result = await repository.findValidSeatIdsForEventLocation(
      eventLocationId,
      seatIds
    );

    expect(result).toEqual([1, 3]);
    expect(modelMock.sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT s.seat_id"),
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          seat_ids: seatIds,
          event_location_id: eventLocationId,
        },
        transaction: undefined,
      }
    );
  });
});
