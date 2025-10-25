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
}
