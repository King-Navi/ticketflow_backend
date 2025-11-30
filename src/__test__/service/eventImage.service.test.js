import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";

import EventRepository from "../../repositories/event.repository";
import EventImageRepository from "../../repositories/eventImage.repository";
import EventImageTypeRepository from "../../repositories/eventImageType.repository";

import {
  createEventImageService,
  getEventImagesService,
} from "../../service/eventImage.service";

describe("EventImage services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPLOAD_BASE = "uploads/events";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("createEventImageService_ValidInput_CreatesImageAndReturnsPublicPath", async () => {
    const event = { event_id: 10 };
    const imgType = { event_image_type_id: 3 };
    const createdImageId = 99;

    // Repositorios
    const findEventSpy = jest
      .spyOn(EventRepository.prototype, "findById")
      .mockResolvedValue(event);

    const findTypeSpy = jest
      .spyOn(EventImageTypeRepository.prototype, "findByCode")
      .mockResolvedValue(imgType);

    const createImageSpy = jest
      .spyOn(EventImageRepository.prototype, "create")
      .mockResolvedValue(createdImageId);

    const existsSpy = jest
      .spyOn(fs, "existsSync")
      .mockReturnValue(false);

    const mkdirSpy = jest
      .spyOn(fs, "mkdirSync")
      .mockImplementation(() => {});

    const renameSpy = jest
      .spyOn(fs, "renameSync")
      .mockImplementation(() => {});

    const tmpFilePath = "/tmp/upload-abc.jpg";
    const input = {
      eventId: 10,
      imageTypeCode: "cover",
      altText: "Cover image",
      sortOrder: "5",
      tmpFilePath,
    };

    const result = await createEventImageService(input);

    const eventDir = path.join("uploads/events", "10");
    const finalPath = path.join(eventDir, path.basename(tmpFilePath));

    expect(findEventSpy).toHaveBeenCalledWith(10);
    expect(findTypeSpy).toHaveBeenCalledWith("cover");

    expect(existsSpy).toHaveBeenCalledWith(eventDir);
    expect(mkdirSpy).toHaveBeenCalledWith(eventDir, { recursive: true });
    expect(renameSpy).toHaveBeenCalledWith(tmpFilePath, finalPath);

    expect(createImageSpy).toHaveBeenCalledWith({
      event_id: 10,
      event_image_type_id: 3,
      image_path: finalPath,
      alt_text: "Cover image",
      sort_order: 5,
    });

    expect(result).toEqual({
      event_image_id: createdImageId,
      image_path: `/static/events/10/${path.basename(finalPath)}`,
    });
  });

  test("getEventImagesService_ValidEventId_ReturnsImagesWithPublicPaths", async () => {
    const eventId = 10;

    const findEventSpy = jest
      .spyOn(EventRepository.prototype, "findById")
      .mockResolvedValue({ event_id: eventId });

    const raws = [
      {
        event_image_id: 1,
        event_id: eventId,
        event_image_type_id: 3,
        alt_text: "Cover",
        sort_order: 1,
        image_path: "uploads/events/10/upload-abc.jpg",
        event_image_type: { code: "cover" },
      },
    ];

    const findImagesSpy = jest
      .spyOn(EventImageRepository.prototype, "findAllByEventId")
      .mockResolvedValue(raws);

    const result = await getEventImagesService(String(eventId));

    expect(findEventSpy).toHaveBeenCalledWith(eventId);
    expect(findImagesSpy).toHaveBeenCalledWith(eventId);

    expect(result).toEqual({
      event_id: eventId,
      images: [
        {
          event_image_id: 1,
          event_id: eventId,
          event_image_type_id: 3,
          image_type: "cover",
          alt_text: "Cover",
          sort_order: 1,
          image_path: "/static/events/10/upload-abc.jpg",
        },
      ],
    });
  });
});
