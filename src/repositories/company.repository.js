import { Sequelize } from "sequelize";
import Company from "../model_db/Company.js";

export default class CompanyRepository {
  constructor(model = Company) {
    this.model = model;
  }

  /**
   * Finds a company by its ID.
   *
   * @async
   * @param {number} idCompany - The company ID to look up.
   * @returns {Promise<Object|null>} The company record if found, otherwise null.
   *
   * @throws {Error} If there is a database or connection error.
   */
  async findCompanyById(idCompany) {
    try {
      return await this.model.findByPk(idCompany);
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
   * Validates that a company exists by ID.
   *
   * @async
   * @param {number|null|undefined} idCompany - The company ID to validate.
   * @throws {Error} If the company does not exist or an error occurs.
   */
  async validateCompanyExists(idCompany) {
    if (idCompany === null || idCompany === undefined) return;

    const company = await this.findCompanyById(idCompany);
    if (!company) {
      throw new Error(`Company with ID ${idCompany} does not exist.`);
    }
  }
}
