import { jest } from "@jest/globals";
import OrganizerRepository from "../../repositories/organizer.repository.js";
import {
  updateOrganizerProfileService,
  getOrganizerBasicInfoService,
} from "../../service/organizer.service.js"; 

describe("updateOrganizerProfileService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("updateOrganizerProfileService_ValidPayload_UpdatesOrganizer", async () => {
    const credentialId = 123;
    const payload = {
      first_name: "John",
      last_name: "Doe",
      middle_name: "X",
      company_id: 42,
    };

    const updatedOrganizer = {
      organizer_id: 99,
      first_name: "John",
      last_name: "Doe",
      middle_name: "X",
      company_id: 42,
    };

    const updateSpy = jest
      .spyOn(OrganizerRepository.prototype, "updateOrganizerInfoByCredentialId")
      .mockResolvedValue(updatedOrganizer);

    const result = await updateOrganizerProfileService(credentialId, payload);

    expect(updateSpy).toHaveBeenCalledWith(credentialId, {
      first_name: "John",
      last_name: "Doe",
      middle_name: "X",
      company_id: 42,
    });

    expect(result).toEqual(updatedOrganizer);
  });

  test("updateOrganizerProfileService_WithoutCredentialId_ThrowsUnauthorized", async () => {
    await expect(
      updateOrganizerProfileService(null, { first_name: "John" })
    ).rejects.toThrow("Unauthorized.");
  });
});

describe("getOrganizerBasicInfoService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getOrganizerBasicInfoService_ExistingOrganizer_ReturnsBasicInfo", async () => {
    const credentialId = 777;

    const fullOrganizerRow = {
      organizer_id: 10,
      first_name: "Jane",
      middle_name: "M.",
      last_name: "Smith",
      company_id: 5,
      some_other_field: "ignored",
    };

    const findSpy = jest
      .spyOn(OrganizerRepository.prototype, "findOrganizerByCredentialId")
      .mockResolvedValue(fullOrganizerRow);

    const result = await getOrganizerBasicInfoService(credentialId);

    expect(findSpy).toHaveBeenCalledWith(credentialId);
    expect(result).toEqual({
      first_name: "Jane",
      middle_name: "M.",
      last_name: "Smith",
      company_id: 5,
    });
  });

  test("getOrganizerBasicInfoService_OrganizerNotFound_ThrowsError", async () => {
    const credentialId = 777;

    jest
      .spyOn(OrganizerRepository.prototype, "findOrganizerByCredentialId")
      .mockResolvedValue(null);

    await expect(
      getOrganizerBasicInfoService(credentialId)
    ).rejects.toThrow("Organizer not found.");
  });

  test("getOrganizerBasicInfoService_WithoutCredentialId_ThrowsUnauthorized", async () => {
    await expect(getOrganizerBasicInfoService(null)).rejects.toThrow(
      "Unauthorized."
    );
  });
});
