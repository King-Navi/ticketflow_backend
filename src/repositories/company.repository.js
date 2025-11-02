import { Sequelize } from "sequelize";
import Company from "../model_db/company.js";

export default class CompanyRepository {
  constructor(model = Company) {
    this.model = model;
  }

  /**
   * Finds a company by its ID.
   *
   * @async
   * @param {number} companyId - The company ID to look up.
   * @returns {Promise<Object|null>} The company record if found, otherwise null.
   *
   * @throws {Error} If there is a database or connection error.
   */
  async findCompanyById(companyId) {
    try {
      return await this.model.findByPk(companyId);
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
   * @param {number|null|undefined} companyId - The company ID to validate.
   * @throws {Error} If the company does not exist or an error occurs.
   */
  async validateCompanyExists(companyId) {
    if (companyId === null || companyId === undefined) return;

    const company = await this.findCompanyById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} does not exist.`);
    }
  }

  /**
   * Creates a new company row.
   *
   * @async
   * @param {string} companyName - The registered name of the company.
   * @param {string} taxId - The tax identifier (RFC, VAT, etc).
   * @returns {Promise<number>} The new company's primary key (company_id).
   *
   * @throws {Error} If insert fails or the DB connection has an issue.
   */
  async createCompany(companyName, taxId) {
    try {
      const newCompany = await this.model.create({
        company_name: companyName,
        tax_id: taxId,
      });

      return newCompany.company_id;
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
