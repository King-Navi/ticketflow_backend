import { jest } from "@jest/globals";
import OrganizerRepository from "../../repositories/organizer.repository.js";

describe("OrganizerRepository (one test per function)", () => {
  let modelMock;
  let companyRepoMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    companyRepoMock = {
      validateCompanyExists: jest.fn(),
    };

    repository = new OrganizerRepository(modelMock, companyRepoMock);
  });

  // findOrganizerByCredentialId
  test("findOrganizerByCredentialId_OrganizerExists_ReturnsOrganizer", async () => {
    const credentialId = 5;
    const organizer = {
      organizer_id: 1,
      credential_id: credentialId,
      first_name: "John",
      last_name: "Doe",
    };

    modelMock.findOne.mockResolvedValue(organizer);

    const result = await repository.findOrganizerByCredentialId(credentialId);

    expect(result).toBe(organizer);
    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { credential_id: credentialId },
    });
  });

  // registerOrganizer
  test("registerOrganizer_ValidData_ReturnsNewOrganizerId", async () => {
    const firstName = "Alice";
    const lastName = "Smith";
    const middleName = null;
    const credentialId = 10;
    const companyId = 3;

    // No organizer yet for this credential
    modelMock.findOne.mockResolvedValue(null);

    // Company exists
    companyRepoMock.validateCompanyExists.mockResolvedValue();

    const created = {
      organizer_id: 7,
      first_name: firstName,
      last_name: lastName,
      middle_name: null,
      company_id: companyId,
      credential_id: credentialId,
    };

    modelMock.create.mockResolvedValue(created);

    const result = await repository.registerOrganizer(
      firstName,
      lastName,
      middleName,
      credentialId,
      companyId
    );

    expect(companyRepoMock.validateCompanyExists).toHaveBeenCalledWith(companyId);
    expect(modelMock.create).toHaveBeenCalledWith({
      first_name: firstName,
      last_name: lastName,
      middle_name: null,
      company_id: companyId,
      credential_id: credentialId,
    });
    expect(result).toBe(7);
  });

  // updateOrganizerInfoByCredentialId
  test("updateOrganizerInfoByCredentialId_ValidData_ReturnsUpdatedOrganizer", async () => {
    const credentialId = 20;

    const organizerInstance = {
      get: jest.fn().mockReturnValue({
        organizer_id: 5,
        credential_id: credentialId,
        first_name: "Old",
        last_name: "Name",
        middle_name: null,
        company_id: 1,
      }),
    };

    modelMock.findOne.mockResolvedValue(organizerInstance);

    const updatedInstance = {
      get: jest.fn().mockReturnValue({
        organizer_id: 5,
        credential_id: credentialId,
        first_name: "New",
        last_name: "Last",
        middle_name: "Mid",
        company_id: 10,
      }),
    };

    modelMock.update.mockResolvedValue([1, [updatedInstance]]);
    companyRepoMock.validateCompanyExists.mockResolvedValue();

    const data = {
      first_name: "New",
      last_name: "Last",
      middle_name: "Mid",
      company_id: 10,
    };

    const result = await repository.updateOrganizerInfoByCredentialId(
      credentialId,
      data
    );

    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { credential_id: credentialId },
    });

    expect(companyRepoMock.validateCompanyExists).toHaveBeenCalledWith(10);

    expect(modelMock.update).toHaveBeenCalledWith(
      {
        first_name: "New",
        last_name: "Last",
        middle_name: "Mid",
        company_id: 10,
        updatedAt: expect.any(Date),
      },
      {
        where: { credential_id: credentialId },
        returning: true,
      }
    );

    expect(result).toEqual({
      organizer_id: 5,
      credential_id: credentialId,
      first_name: "New",
      last_name: "Last",
      middle_name: "Mid",
      company_id: 10,
    });
  });
});
