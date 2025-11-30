import { jest } from "@jest/globals";
import EventLocationLayoutRepository from "../../repositories/eventLocationLayout.repository.js";

describe("EventLocationLayoutRepository", () => {
  let EventLocationMock;
  let SectionMock;
  let SeatMock;
  let repository;

  beforeEach(() => {
    EventLocationMock = {
      findByPk: jest.fn(),
    };
    SectionMock = {};
    SeatMock = {};

    repository = new EventLocationLayoutRepository({
      EventLocation: EventLocationMock,
      Section: SectionMock,
      Seat: SeatMock,
    });
  });

  test("findLayout_ValidId_ReturnsLayout", async () => {
    const eventLocationId = 1;
    const layout = {
      event_location_id: eventLocationId,
      venue_name: "Foro Sol",
      sections: [],
    };

    EventLocationMock.findByPk.mockResolvedValue(layout);

    const result = await repository.findLayout(eventLocationId);

    expect(result).toBe(layout);

    expect(EventLocationMock.findByPk).toHaveBeenCalledWith(
      eventLocationId,
      expect.objectContaining({
        attributes: expect.arrayContaining([
          "event_location_id",
          "venue_name",
          "address_line1",
        ]),
        include: [
          expect.objectContaining({
            model: SectionMock,
            as: "sections",
            attributes: expect.arrayContaining([
              "section_id",
              "section_name",
            ]),
            include: [
              expect.objectContaining({
                model: SeatMock,
                as: "seats",
                attributes: expect.arrayContaining([
                  "seat_id",
                  "row_no",
                  "seat_no",
                ]),
              }),
            ],
          }),
        ],
      })
    );
  });
});
