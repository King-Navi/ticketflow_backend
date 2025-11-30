import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import EventImageRepository from "../../repositories/eventImage.repository";

describe("EventImageRepository", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    repository = new EventImageRepository(modelMock);
  });

  // create
  test("create_ValidData_ReturnsNewEventImageId", async () => {
    const data = {
      event_id: 1,
      event_image_type_id: 2,
      image_path: "/images/event1.jpg",
      alt_text: "Banner",
      sort_order: 1,
    };

    const createdRecord = { event_image_id: 10, ...data };
    modelMock.create.mockResolvedValue(createdRecord);

    const result = await repository.create(data);

    expect(result).toBe(10);
    expect(modelMock.create).toHaveBeenCalledWith(
      {
        event_id: 1,
        event_image_type_id: 2,
        image_path: "/images/event1.jpg",
        alt_text: "Banner",
        sort_order: 1,
      },
      { transaction: undefined }
    );
  });

  test("create_MissingEventId_ThrowsRequiredError", async () => {
    const data = {
      event_image_type_id: 2,
      image_path: "/images/event1.jpg",
    };

    await expect(repository.create(data)).rejects.toThrow(
      "event_id is required."
    );
    expect(modelMock.create).not.toHaveBeenCalled();
  });

  // findAllByEventId
  test("findAllByEventId_ValidEventId_ReturnsImages", async () => {
    const eventId = 5;
    const images = [
      { event_image_id: 1, event_id: eventId, sort_order: 1 },
      { event_image_id: 2, event_id: eventId, sort_order: 2 },
    ];

    modelMock.findAll.mockResolvedValue(images);

    const result = await repository.findAllByEventId(eventId);

    expect(result).toBe(images);
    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { event_id: eventId },
      order: [
        ["sort_order", "ASC"],
        ["event_image_id", "ASC"],
      ],
    });
  });

  test("findAllByEventId_MissingEventId_ThrowsRequiredError", async () => {
    await expect(repository.findAllByEventId(null)).rejects.toThrow(
      "eventId is required."
    );
    expect(modelMock.findAll).not.toHaveBeenCalled();
  });
});
