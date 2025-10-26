import { Sequelize } from "sequelize";
import Attendee from "../model_db/Attendee.js";

export default class AttendeeRepository {
  constructor(model = Attendee) {
    this.model = model;
  }

  /**
   * Retrieves the Attendee record associated with a given Credential ID.
   *
   * @async
   * @param {number} idCredential - The ID of the Credential to look up.
   * @returns {Promise<Object|null>} Returns the attendee object if found, or `null` if no attendee is linked to that credential.
   * 
   * @throws {Error} Throws an error if the database connection fails or the query encounters an issue.
   */
  async findAttendeeByCredentialId(idCredential) {
    try {
      const attendee = await this.model.findOne({
        where: { idCredential },
      });

      return attendee;
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

  /**
   * Registers a new attendee linked to an existing credential.
   *
   * @async
   * @param {string} firstName - Attendee's first name.
   * @param {string} lastName - Attendee's last name.
   * @param {string|null} middleName - Attendee's middle name (optional).
   * @param {number} idCredential - ID of the existing credential to link.
   * @returns {Promise<number>} The ID of the newly created attendee.
   * 
   * @throws {Error} If the attendee already exists or if there is a database/connection error.
   */
  async registerAttendee(firstName, lastName, middleName, idCredential) {
    try {
      const existing = await this.model.findOne({
        where: { idCredential },
      });

      if (existing) {
        throw new Error(`An attendee already exists for credential ID ${idCredential}.`);
      }

      const newAttendee = await this.model.create({
        firstName,
        lastName,
        middleName: middleName || null,
        idCredential,
      });

      return newAttendee.idAttendee;
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
