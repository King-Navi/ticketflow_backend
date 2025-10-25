import { Sequelize } from "sequelize";
import Organizer from "../model_db/Organizer.js";

export default class OrganizerRepository {
  constructor(model = Organizer) {
    this.model = model;
  }

  /**
   * Retrieves the Organizer record associated with a given Credential ID.
   *
   * @async
   * @param {number} idCredential - The ID of the Credential to look up.
   * @returns {Promise<Object|null>} Returns the organizer object if found, or `null` if no organizer is linked to that credential.
   * 
   * @throws {Error} Throws an error if the database connection fails or the query encounters an issue.
   */
  async findOrganizerByCredentialId(idCredential) {
    try {
      const organizer = await this.model.findOne({
        where: { idCredential },
      });

      return organizer;
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
