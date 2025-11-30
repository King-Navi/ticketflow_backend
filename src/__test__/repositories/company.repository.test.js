import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import CompanyRepository from "../../repositories/company.repository.js";

describe("CompanyRepository", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findByPk: jest.fn(),
      create: jest.fn(),
    };
    repository = new CompanyRepository(modelMock);
  });

  describe("findCompanyById", () => {
    test("findCompanyById_CompanyExists_ReturnsCompany", async () => {
      const companyId = 1;
      const company = { company_id: companyId, company_name: "Acme" };

      modelMock.findByPk.mockResolvedValue(company);

      await expect(repository.findCompanyById(companyId)).resolves.toEqual(
        company
      );

      expect(modelMock.findByPk).toHaveBeenCalledWith(companyId);
    });

    test("findCompanyById_CompanyDoesNotExist_ReturnsNull", async () => {
      const companyId = 2;

      modelMock.findByPk.mockResolvedValue(null);

      await expect(repository.findCompanyById(companyId)).resolves.toBeNull();

      expect(modelMock.findByPk).toHaveBeenCalledWith(companyId);
    });

    test("findCompanyById_ConnectionError_ThrowsConnectionMessage", async () => {
      const companyId = 3;
      const error = new Sequelize.ConnectionError(
        new Error("connection failed")
      );

      modelMock.findByPk.mockRejectedValue(error);

      await expect(repository.findCompanyById(companyId)).rejects.toThrow(
        "Cannot connect to the database."
      );
    });

    test("findCompanyById_DatabaseError_ThrowsDatabaseMessage", async () => {
      const companyId = 4;
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.findByPk.mockRejectedValue(error);

      await expect(repository.findCompanyById(companyId)).rejects.toThrow(
        "Database error occurred."
      );
    });

    test("findCompanyById_UnknownError_RethrowsOriginalError", async () => {
      const companyId = 5;
      const error = new Error("Unknown failure");

      modelMock.findByPk.mockRejectedValue(error);

      await expect(repository.findCompanyById(companyId)).rejects.toThrow(
        "Unknown failure"
      );
    });
  });

  describe("validateCompanyExists", () => {
    test("validateCompanyExists_NullCompanyId_DoesNothing", async () => {
      const spy = jest.spyOn(repository, "findCompanyById");

      await expect(repository.validateCompanyExists(null)).resolves.toBeUndefined();

      expect(spy).not.toHaveBeenCalled();
    });

    test("validateCompanyExists_UndefinedCompanyId_DoesNothing", async () => {
      const spy = jest.spyOn(repository, "findCompanyById");

      await expect(
        repository.validateCompanyExists(undefined)
      ).resolves.toBeUndefined();

      expect(spy).not.toHaveBeenCalled();
    });

    test("validateCompanyExists_CompanyExists_DoesNotThrow", async () => {
      const companyId = 10;
      const company = { company_id: companyId };

      const spy = jest
        .spyOn(repository, "findCompanyById")
        .mockResolvedValue(company);

      await expect(
        repository.validateCompanyExists(companyId)
      ).resolves.toBeUndefined();

      expect(spy).toHaveBeenCalledWith(companyId);
    });

    test("validateCompanyExists_CompanyDoesNotExist_ThrowsNotExistError", async () => {
      const companyId = 11;

      const spy = jest
        .spyOn(repository, "findCompanyById")
        .mockResolvedValue(null);

      await expect(
        repository.validateCompanyExists(companyId)
      ).rejects.toThrow(`Company with ID ${companyId} does not exist.`);

      expect(spy).toHaveBeenCalledWith(companyId);
    });

    test("validateCompanyExists_FindCompanyByIdThrows_RethrowsError", async () => {
      const companyId = 12;
      const error = new Error("Some failure");

      const spy = jest
        .spyOn(repository, "findCompanyById")
        .mockRejectedValue(error);

      await expect(
        repository.validateCompanyExists(companyId)
      ).rejects.toThrow("Some failure");

      expect(spy).toHaveBeenCalledWith(companyId);
    });
  });

  // -----------------------------
  // createCompany
  // -----------------------------
  describe("createCompany", () => {
    test("createCompany_ValidData_ReturnsNewCompanyId", async () => {
      const companyName = "Acme Corp";
      const taxId = "RFC123";
      const newCompany = { company_id: 100, company_name: companyName, tax_id: taxId };

      modelMock.create.mockResolvedValue(newCompany);

      await expect(
        repository.createCompany(companyName, taxId)
      ).resolves.toBe(100);

      expect(modelMock.create).toHaveBeenCalledWith({
        company_name: companyName,
        tax_id: taxId,
      });
    });

    test("createCompany_ConnectionError_ThrowsConnectionMessage", async () => {
      const companyName = "Acme Corp";
      const taxId = "RFC123";
      const error = new Sequelize.ConnectionError(
        new Error("connection failed")
      );

      modelMock.create.mockRejectedValue(error);

      await expect(
        repository.createCompany(companyName, taxId)
      ).rejects.toThrow("Cannot connect to the database.");
    });

    test("createCompany_DatabaseError_ThrowsDatabaseMessage", async () => {
      const companyName = "Acme Corp";
      const taxId = "RFC123";
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.create.mockRejectedValue(error);

      await expect(
        repository.createCompany(companyName, taxId)
      ).rejects.toThrow("Database error occurred.");
    });

    test("createCompany_UnknownError_RethrowsOriginalError", async () => {
      const companyName = "Acme Corp";
      const taxId = "RFC123";
      const error = new Error("Unexpected failure");

      modelMock.create.mockRejectedValue(error);

      await expect(
        repository.createCompany(companyName, taxId)
      ).rejects.toThrow("Unexpected failure");
    });
  });
});
