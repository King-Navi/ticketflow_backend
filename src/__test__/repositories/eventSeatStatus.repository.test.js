import { jest } from "@jest/globals";
import EventSeatStatusRepository from "../../repositories/eventSeatStatus.repository.js";

describe("EventSeatStatusRepository", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
    };

    repository = new EventSeatStatusRepository({ EventSeatStatus: modelMock });
  });

  test("findByName_ValidName_ReturnsStatusRow", async () => {
    const statusName = "available";

    const row = {
      event_seat_status_id: 1,
      status_name: statusName,
      created_at: new Date("2025-01-01T00:00:00Z"),
      updated_at: new Date("2025-01-02T00:00:00Z"),
    };

    modelMock.findOne.mockResolvedValue(row);

    const result = await repository.findByName(statusName);

    expect(result).toBe(row);
    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { status_name: statusName },
      attributes: [
        "event_seat_status_id",
        "status_name",
        "created_at",
        "updated_at",
      ],
    });
  });
});
