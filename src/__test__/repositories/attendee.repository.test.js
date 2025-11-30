import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import AttendeeRepository from "../../repositories/attendee.repository.js";

describe("AttendeeRepository", () => {
  let attendeeModelMock;
  let credentialModelMock;
  let repository;

  beforeEach(() => {
    attendeeModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    credentialModelMock = {
      findByPk: jest.fn(),
    };

    repository = new AttendeeRepository(attendeeModelMock, credentialModelMock);
  });


  describe("findAttendeeByCredentialId", () => {
    test("findAttendeeByCredentialId_AttendeeExists_ReturnsAttendee", async () => {
      const credentialId = 1;
      const attendee = { attendee_id: 10, credential_id: credentialId };

      attendeeModelMock.findOne.mockResolvedValue(attendee);

      await expect(
        repository.findAttendeeByCredentialId(credentialId)
      ).resolves.toEqual(attendee);

      expect(attendeeModelMock.findOne).toHaveBeenCalledWith({
        where: { credential_id: credentialId },
      });
    });

    test("findAttendeeByCredentialId_AttendeeDoesNotExist_ReturnsNull", async () => {
      const credentialId = 2;

      attendeeModelMock.findOne.mockResolvedValue(null);

      await expect(
        repository.findAttendeeByCredentialId(credentialId)
      ).resolves.toBeNull();

      expect(attendeeModelMock.findOne).toHaveBeenCalledWith({
        where: { credential_id: credentialId },
      });
    });

    test("findAttendeeByCredentialId_ConnectionError_ThrowsConnectionMessage", async () => {
      const credentialId = 3;
      const error = new Sequelize.ConnectionError(
        new Error("connection failed")
      );

      attendeeModelMock.findOne.mockRejectedValue(error);

      await expect(
        repository.findAttendeeByCredentialId(credentialId)
      ).rejects.toThrow("Cannot connect to the database.");
    });

    test("findAttendeeByCredentialId_DatabaseError_ThrowsDatabaseMessage", async () => {
      const credentialId = 4;
      const error = new Sequelize.DatabaseError(new Error("db failed"));

      attendeeModelMock.findOne.mockRejectedValue(error);

      await expect(
        repository.findAttendeeByCredentialId(credentialId)
      ).rejects.toThrow("Database error occurred.");
    });

    test("findAttendeeByCredentialId_UnknownError_RethrowsOriginalError", async () => {
      const credentialId = 5;
      const error = new Error("Unknown failure");

      attendeeModelMock.findOne.mockRejectedValue(error);

      await expect(
        repository.findAttendeeByCredentialId(credentialId)
      ).rejects.toThrow("Unknown failure");
    });
  });

  describe("registerAttendee", () => {
    test("registerAttendee_ValidData_ReturnsNewAttendeeId", async () => {
      const firstName = "John";
      const lastName = "Doe";
      const middleName = "M";
      const credentialId = 10;

      const credential = { credential_id: credentialId, role: "attendee" };
      const newAttendee = { attendee_id: 100, credential_id: credentialId };

      credentialModelMock.findByPk.mockResolvedValue(credential);
      attendeeModelMock.findOne.mockResolvedValue(null);
      attendeeModelMock.create.mockResolvedValue(newAttendee);

      await expect(
        repository.registerAttendee(
          firstName,
          lastName,
          middleName,
          credentialId
        )
      ).resolves.toBe(newAttendee.attendee_id);

      expect(credentialModelMock.findByPk).toHaveBeenCalledWith(credentialId);
      expect(attendeeModelMock.findOne).toHaveBeenCalledWith({
        where: { credential_id: credentialId },
      });
      expect(attendeeModelMock.create).toHaveBeenCalledWith({
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        credential_id: credentialId,
      });
    });

    test("registerAttendee_CredentialDoesNotExist_ThrowsError", async () => {
      const credentialId = 11;

      credentialModelMock.findByPk.mockResolvedValue(null);

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow(`Credential ${credentialId} does not exist.`);
    });

    test("registerAttendee_CredentialRoleIsNotAttendee_ThrowsError", async () => {
      const credentialId = 12;

      credentialModelMock.findByPk.mockResolvedValue({
        credential_id: credentialId,
        role: "admin",
      });

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow(
        `Credential ${credentialId} is role=admin, not attendee.`
      );
    });

    test("registerAttendee_AttendeeAlreadyExists_ThrowsError", async () => {
      const credentialId = 13;

      credentialModelMock.findByPk.mockResolvedValue({
        credential_id: credentialId,
        role: "attendee",
      });

      attendeeModelMock.findOne.mockResolvedValue({
        attendee_id: 1,
        credential_id: credentialId,
      });

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow(
        `An attendee already exists for credential ID ${credentialId}.`
      );
    });

    test("registerAttendee_ConnectionError_ThrowsConnectionMessage", async () => {
      const credentialId = 14;
      const error = new Sequelize.ConnectionError(
        new Error("connection failed")
      );

      credentialModelMock.findByPk.mockRejectedValue(error);

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow("Cannot connect to the database.");
    });

    test("registerAttendee_DatabaseError_ThrowsDatabaseMessage", async () => {
      const credentialId = 15;
      const error = new Sequelize.DatabaseError(new Error("db failed"));

      credentialModelMock.findByPk.mockRejectedValue(error);

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow("Database error occurred.");
    });

    test("registerAttendee_UnknownError_RethrowsOriginalError", async () => {
      const credentialId = 16;
      const error = new Error("Unexpected failure");

      credentialModelMock.findByPk.mockRejectedValue(error);

      await expect(
        repository.registerAttendee("Jane", "Doe", null, credentialId)
      ).rejects.toThrow("Unexpected failure");
    });
  });
});
