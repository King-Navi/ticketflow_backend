import { Sequelize } from "sequelize";
import Attendee from "../model_db/attendee.js";
import Credential from "../model_db/credential.js";

export default class AttendeeRepository {
  constructor(attendeeModel = Attendee, credentialModel = Credential) {
    this.model = attendeeModel;
    this.credentialModel = credentialModel;
  }

  /**
   * Retrieves the Attendee record associated with a given Credential ID.
   *
   * @async
   * @param {number} credentialId - The ID of the Credential to look up.
   * @returns {Promise<Object|null>} Returns the attendee object if found, or `null` if no attendee is linked to that credential.
   * 
   * @throws {Error} Throws an error if the database connection fails or the query encounters an issue.
   */
  async findAttendeeByCredentialId(credentialId) {
    try {
      const attendee = await this.model.findOne({
        where: { credential_id: credentialId },
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
   * @param {number} credentialId - ID of the existing credential to link.
   * @returns {Promise<number>} The ID of the newly created attendee.
   * 
   * @throws {Error} If the attendee already exists or if there is a database/connection error.
   */
  async registerAttendee(firstName, lastName, middleName, credentialId) {
    try {
      const cred = await this.credentialModel.findByPk(credentialId);
      if (!cred) {
        throw new Error(`Credential ${credentialId} does not exist.`);
      }
      if (cred.role !== "attendee") {
        throw new Error(
          `Credential ${credentialId} is role=${cred.role}, not attendee.`
        );
      }
      const existing = await this.model.findOne({
        where: { credential_id: credentialId },
      });

      if (existing) {
        throw new Error(`An attendee already exists for credential ID ${credentialId}.`);
      }

      const newAttendee = await this.model.create({
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        credential_id: credentialId,
      });
      return newAttendee.attendee_id;
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
