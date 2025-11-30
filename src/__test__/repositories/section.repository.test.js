import { jest } from "@jest/globals";
import SectionRepository from "../../repositories/section.repository.js";

describe("SectionRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
    };

    repository = new SectionRepository(modelMock);
  });

  test("createSection_ValidData_ReturnsSectionId", async () => {
    const data = {
      section_name: "VIP",
      event_location_id: 10,
    };

    const created = {
      section_id: 99,
      ...data,
    };

    modelMock.create.mockResolvedValue(created);

    const result = await repository.createSection(data);

    expect(result).toBe(99);
    expect(modelMock.create).toHaveBeenCalledWith(
      {
        section_name: "VIP",
        event_location_id: 10,
      },
      { transaction: undefined }
    );
  });

  test("findById_ValidId_ReturnsSectionInstance", async () => {
    const sectionId = 5;
    const instance = { section_id: sectionId, section_name: "General" };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.findById(sectionId);

    expect(result).toBe(instance);
    expect(modelMock.findByPk).toHaveBeenCalledWith(sectionId);
  });

  test("findAllByEventLocationId_ValidLocationId_ReturnsSections", async () => {
    const eventLocationId = 10;

    const sections = [
      {
        section_id: 1,
        section_name: "A",
        event_location_id: eventLocationId,
      },
      {
        section_id: 2,
        section_name: "B",
        event_location_id: eventLocationId,
      },
    ];

    modelMock.findAll.mockResolvedValue(sections);

    const result = await repository.findAllByEventLocationId(eventLocationId);

    expect(result).toBe(sections);
    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { event_location_id: eventLocationId },
      attributes: [
        "section_id",
        "section_name",
        "event_location_id",
        "created_at",
        "updated_at",
      ],
      order: [["section_name", "ASC"]],
    });
  });
});
