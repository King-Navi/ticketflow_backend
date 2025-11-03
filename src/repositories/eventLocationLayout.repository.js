import { Sequelize } from "sequelize";
import EventLocationModel from "../model_db/event_location.js";
import SectionModel from "../model_db/section.js";
import SeatModel from "../model_db/seat.js";

export default class EventLocationLayoutRepository {
  constructor({
    EventLocation = EventLocationModel,
    Section = SectionModel,
    Seat = SeatModel,
  } = {}) {
    this.EventLocation = EventLocation;
    this.Section = Section;
    this.Seat = Seat;
  }

  async findLayout(eventLocationId) {
    try {
      return await this.EventLocation.findByPk(eventLocationId, {
        attributes: [
          "event_location_id",
          "venue_name",
          "address_line1",
          "address_line2",
          "city",
          "state",
          "country",
          "postal_code",
          "capacity",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: this.Section,
            as: "sections",
            attributes: [
              "section_id",
              "section_name",
              "created_at",
              "updated_at",
            ],
            include: [
              {
                model: this.Seat,
                as: "seats",
                attributes: [
                  "seat_id",
                  "row_no",
                  "seat_no",
                  "created_at",
                  "updated_at",
                ],
              },
            ],
          },
        ],
      });
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }
}
