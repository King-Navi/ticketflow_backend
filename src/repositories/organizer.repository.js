import { Sequelize } from "sequelize";
import Organizer from "../model_db/organizer.js";
import CompanyRepository from "../repositories/company.repository.js";

export default class OrganizerRepository {
  constructor(model = Organizer, companyRepo = new CompanyRepository()) {
    this.model = model;
    this.companyRepo = companyRepo;
  }

  /**
   * Retrieves the Organizer record associated with a given Credential ID.
   *
   * @async
   * @param {number} credentialId - The ID of the Credential to look up.
   * @returns {Promise<Object|null>} Returns the organizer object if found, or `null` if no organizer is linked to that credential.
   * 
   * @throws {Error} Throws an error if the database connection fails or the query encounters an issue.
   */
  async findOrganizerByCredentialId(credentialId) {
    try {
      const organizer = await this.model.findOne({
        where: { credential_id: credentialId },
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


  /**
   * Registers a new organizer linked to an existing credential and company.
   *
   * @async
   * @param {string} firstName - Organizer's first name.
   * @param {string} lastName - Organizer's last name.
   * @param {string|null} middleName - Organizer's middle name (optional).
   * @param {number} credentialId - ID of the linked credential.
   * @param {number|null} companyId - ID of the company (must exist in DB, or null).
   * @returns {Promise<number>} The ID of the newly created organizer.
   *
   * @throws {Error} If the organizer already exists, the company is invalid, or a DB error occurs.
   */
  async registerOrganizer(firstName, lastName, middleName, credentialId, companyId) {
    try {
      const existing = await this.model.findOne({ where: { credential_id: credentialId } });
      if (existing) {
        throw new Error(`An organizer already exists for credential ID ${credentialId}.`);
      }

      await this.companyRepo.validateCompanyExists(companyId);

      const newOrganizer = await this.model.create({
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        company_id: companyId ?? null,
        credential_id: credentialId,
      });
      return newOrganizer.organizer_id;
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
