import { Sequelize } from "sequelize";
import Organizer from "../model_db/Organizer.js";
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


  /**
   * Registers a new organizer linked to an existing credential and company.
   *
   * @async
   * @param {string} firstName - Organizer's first name.
   * @param {string} lastName - Organizer's last name.
   * @param {string|null} middleName - Organizer's middle name (optional).
   * @param {number} idCredential - ID of the linked credential.
   * @param {number|null} idCompany - ID of the company (must exist in DB, or null).
   * @returns {Promise<number>} The ID of the newly created organizer.
   *
   * @throws {Error} If the organizer already exists, the company is invalid, or a DB error occurs.
   */
  async registerOrganizer(firstName, lastName, middleName, idCredential, idCompany) {
    try {
      const existing = await this.model.findOne({ where: { idCredential } });
      if (existing) {
        throw new Error(`An organizer already exists for credential ID ${idCredential}.`);
      }

      await this.companyRepo.validateCompanyExists(idCompany);

      const newOrganizer = await this.model.create({
        firstName,
        lastName,
        middleName: middleName || null,
        idCompany: idCompany || null,
        idCredential,
      });
      return newOrganizer.idOrganizer;
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
