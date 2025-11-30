import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import CredentialRepository from "../../repositories/credential.repository.js";

describe("CredentialRepository", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    repository = new CredentialRepository(modelMock);

    repository.sanitize = repository._sanitize.bind(repository);

    bcrypt.compare = jest.fn();
    bcrypt.hash = jest.fn();
  });

  test("_sanitize_InstanceWithPassword_RemovesPasswordHash", () => {
    const instance = {
      get: jest.fn().mockReturnValue({
        credential_id: 1,
        email: "user@test.com",
        password_hash: "secret",
        nickname: "nick",
      }),
    };

    const result = repository._sanitize(instance);

    expect(instance.get).toHaveBeenCalledWith({ plain: true });
    expect(result).toEqual({
      credential_id: 1,
      email: "user@test.com",
      nickname: "nick",
    });
    expect(result.password_hash).toBeUndefined();
  });

  test("_sanitize_NullInstance_ReturnsNull", () => {
    const result = repository._sanitize(null);
    expect(result).toBeNull();
  });

  describe("findById", () => {
    test("findById_CredentialExists_ReturnsCredential", async () => {
      const credentialId = 1;
      const credential = { credential_id: credentialId };

      modelMock.findByPk.mockResolvedValue(credential);

      await expect(repository.findById(credentialId)).resolves.toEqual(
        credential
      );
      expect(modelMock.findByPk).toHaveBeenCalledWith(credentialId);
    });

    test("findById_CredentialDoesNotExist_ReturnsNull", async () => {
      const credentialId = 2;

      modelMock.findByPk.mockResolvedValue(null);

      await expect(repository.findById(credentialId)).resolves.toBeNull();
      expect(modelMock.findByPk).toHaveBeenCalledWith(credentialId);
    });

    test("findById_ConnectionError_ThrowsConnectionMessage", async () => {
      const credentialId = 3;
      const error = new Sequelize.ConnectionError(
        new Error("connection failed")
      );

      modelMock.findByPk.mockRejectedValue(error);

      await expect(repository.findById(credentialId)).rejects.toThrow(
        "Cannot connect to the database."
      );
    });

    test("findById_DatabaseError_ThrowsDatabaseMessage", async () => {
      const credentialId = 4;
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.findByPk.mockRejectedValue(error);

      await expect(repository.findById(credentialId)).rejects.toThrow(
        "Database error occurred."
      );
    });
  });


  describe("findCredentialByNickName", () => {
    test("findCredentialByNickName_UserExists_ReturnsUser", async () => {
      const nickname = "UserNick";
      const user = { credential_id: 1, nickname };

      modelMock.findOne.mockResolvedValue(user);

      await expect(
        repository.findCredentialByNickName(nickname)
      ).resolves.toEqual(user);
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("findCredentialByNickName_UserDoesNotExist_ReturnsNull", async () => {
      const nickname = "MissingUser";

      modelMock.findOne.mockResolvedValue(null);

      await expect(
        repository.findCredentialByNickName(nickname)
      ).resolves.toBeNull();
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("findCredentialByNickName_DatabaseError_ThrowsDatabaseMessage", async () => {
      const nickname = "BrokenUser";
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.findOne.mockRejectedValue(error);

      await expect(
        repository.findCredentialByNickName(nickname)
      ).rejects.toThrow("Database error occurred.");
    });
  });


  describe("findCredentialByEmail", () => {
    test("findCredentialByEmail_UserExists_ReturnsUser", async () => {
      const email = "user@example.com";
      const user = { credential_id: 1, email };

      modelMock.findOne.mockResolvedValue(user);

      await expect(
        repository.findCredentialByEmail(email)
      ).resolves.toEqual(user);
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("findCredentialByEmail_UserDoesNotExist_ReturnsNull", async () => {
      const email = "missing@example.com";

      modelMock.findOne.mockResolvedValue(null);

      await expect(
        repository.findCredentialByEmail(email)
      ).resolves.toBeNull();
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("findCredentialByEmail_DatabaseError_ThrowsDatabaseMessage", async () => {
      const email = "broken@example.com";
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.findOne.mockRejectedValue(error);

      await expect(
        repository.findCredentialByEmail(email)
      ).rejects.toThrow("Database error occurred.");
    });
  });

  describe("isValidPassword", () => {
    test("isValidPassword_UserNotFound_ReturnsFalse", async () => {
      const nickname = "ghost";
      const plain = "password";

      jest
        .spyOn(repository, "findCredentialByNickName")
        .mockResolvedValue(null);

      await expect(
        repository.isValidPassword(nickname, plain)
      ).resolves.toBe(false);
    });

    test("isValidPassword_UserWithoutPasswordHash_ReturnsFalse", async () => {
      const nickname = "user";
      const plain = "password";

      jest
        .spyOn(repository, "findCredentialByNickName")
        .mockResolvedValue({ credential_id: 1, nickname });

      await expect(
        repository.isValidPassword(nickname, plain)
      ).resolves.toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("isValidPassword_PasswordMatches_ReturnsTrue", async () => {
      const nickname = "user";
      const plain = "password";
      const hash = "hashed";

      jest
        .spyOn(repository, "findCredentialByNickName")
        .mockResolvedValue({ credential_id: 1, nickname, password_hash: hash });

      bcrypt.compare.mockResolvedValue(true);

      await expect(
        repository.isValidPassword(nickname, plain)
      ).resolves.toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(plain, hash);
    });

    test("isValidPassword_PasswordDoesNotMatch_ReturnsFalse", async () => {
      const nickname = "user";
      const plain = "password";
      const hash = "hashed";

      jest
        .spyOn(repository, "findCredentialByNickName")
        .mockResolvedValue({ credential_id: 1, nickname, password_hash: hash });

      bcrypt.compare.mockResolvedValue(false);

      await expect(
        repository.isValidPassword(nickname, plain)
      ).resolves.toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plain, hash);
    });

    test("isValidPassword_FindNicknameThrows_RethrowsError", async () => {
      const nickname = "user";
      const plain = "password";

      jest
        .spyOn(repository, "findCredentialByNickName")
        .mockRejectedValue(new Error("Lookup failure"));

      await expect(
        repository.isValidPassword(nickname, plain)
      ).rejects.toThrow("Lookup failure");
    });
  });

  describe("isEmailTaken", () => {
    test("isEmailTaken_EmailExists_ReturnsTrue", async () => {
      const email = "User@Example.com";

      modelMock.findOne.mockResolvedValue({ credential_id: 1, email });

      await expect(repository.isEmailTaken(email)).resolves.toBe(true);
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("isEmailTaken_EmailDoesNotExist_ReturnsFalse", async () => {
      const email = "missing@example.com";

      modelMock.findOne.mockResolvedValue(null);

      await expect(repository.isEmailTaken(email)).resolves.toBe(false);
      expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    test("isEmailTaken_DatabaseError_ThrowsDatabaseMessage", async () => {
      const email = "broken@example.com";
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.findOne.mockRejectedValue(error);

      await expect(repository.isEmailTaken(email)).rejects.toThrow(
        "Database error occurred."
      );
    });
  });


  describe("registerCredential", () => {
    test("registerCredential_EmailAlreadyExists_ThrowsEmailExistsError", async () => {
      const data = {
        email: "user@example.com",
        nickname: "user",
        passwordHash: "plain",
        role: "attendee",
      };

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(true);

      await expect(repository.registerCredential(data)).rejects.toThrow(
        "Email already exists."
      );
      expect(repository.isEmailTaken).toHaveBeenCalledWith(
        data.email.toLowerCase()
      );
      expect(modelMock.create).not.toHaveBeenCalled();
    });

    test("registerCredential_ValidData_ReturnsNewCredentialId", async () => {
      const data = {
        email: "User@Example.com",
        nickname: "user",
        passwordHash: "plainPassword",
        role: "attendee",
      };

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(false);

      bcrypt.hash.mockResolvedValue("hashedPassword");

      const newCredential = {
        credential_id: 10,
        email: data.email.toLowerCase(),
        nickname: data.nickname,
        password_hash: "hashedPassword",
        role: data.role,
      };

      modelMock.create.mockResolvedValue(newCredential);

      await expect(repository.registerCredential(data)).resolves.toBe(10);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(modelMock.create).toHaveBeenCalledWith({
        email: data.email.toLowerCase(),
        nickname: data.nickname,
        password_hash: "hashedPassword",
        role: data.role,
      });
    });

    test("registerCredential_DatabaseError_ThrowsDatabaseMessage", async () => {
      const data = {
        email: "user@example.com",
        nickname: "user",
        passwordHash: "plain",
        role: "attendee",
      };

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(false);

      const error = new Sequelize.DatabaseError(new Error("db error"));
      modelMock.create.mockRejectedValue(error);

      await expect(repository.registerCredential(data)).rejects.toThrow(
        "Database error occurred."
      );
    });
  });

  describe("updatePassword", () => {
    test("updatePassword_MissingIdCredential_ThrowsRequiredError", async () => {
      await expect(
        repository.updatePassword(null, "oldPass", "newPassword")
      ).rejects.toThrow("idCredential is required.");
    });

    test("updatePassword_MissingOldOrNewPassword_ThrowsRequiredError", async () => {
      await expect(
        repository.updatePassword(1, null, "newPassword")
      ).rejects.toThrow("Both oldPassword and newPassword are required.");

      await expect(
        repository.updatePassword(1, "oldPass", null)
      ).rejects.toThrow("Both oldPassword and newPassword are required.");
    });

    test("updatePassword_NewPasswordTooShort_ThrowsMinLengthError", async () => {
      await expect(
        repository.updatePassword(1, "oldPass", "short")
      ).rejects.toThrow("New password must be at least 8 characters.");
    });

    test("updatePassword_CredentialNotFound_ThrowsNotFoundError", async () => {
      jest.spyOn(repository, "findById").mockResolvedValue(null);

      await expect(
        repository.updatePassword(1, "oldPass", "newPassword")
      ).rejects.toThrow("Credential not found.");
    });

    test("updatePassword_OldPasswordIncorrect_ThrowsOldPasswordIncorrectError", async () => {
      const user = { credential_id: 1, password_hash: "hash" };
      jest.spyOn(repository, "findById").mockResolvedValue(user);

      bcrypt.compare.mockResolvedValue(false);

      await expect(
        repository.updatePassword(1, "wrongOld", "newPassword")
      ).rejects.toThrow("Old password is incorrect.");
    });

    test("updatePassword_NewPasswordSameAsCurrent_ThrowsSamePasswordError", async () => {
      const user = { credential_id: 1, password_hash: "hash" };
      jest.spyOn(repository, "findById").mockResolvedValue(user);

      bcrypt.compare
        .mockResolvedValueOnce(true) // old password matches
        .mockResolvedValueOnce(true); // new password same as current

      await expect(
        repository.updatePassword(1, "oldPass", "oldPassAgain")
      ).rejects.toThrow(
        "New password cannot be the same as the current password."
      );
    });

    test("updatePassword_ValidUpdate_ReturnsTrue", async () => {
      const user = { credential_id: 1, password_hash: "hash" };
      jest.spyOn(repository, "findById").mockResolvedValue(user);

      bcrypt.compare
        .mockResolvedValueOnce(true) // old matches
        .mockResolvedValueOnce(false); // new different

      bcrypt.hash.mockResolvedValue("newHashedPassword");

      modelMock.update.mockResolvedValue([1, []]);

      await expect(
        repository.updatePassword(1, "oldPass", "newPassword")
      ).resolves.toBe(true);

      expect(modelMock.update).toHaveBeenCalledWith(
        {
          password_hash: "newHashedPassword",
          updatedAt: expect.any(Date),
        },
        {
          where: { credential_id: 1 },
          returning: false,
        }
      );
    });

    test("updatePassword_DatabaseError_ThrowsDatabaseMessage", async () => {
      const user = { credential_id: 1, password_hash: "hash" };
      jest.spyOn(repository, "findById").mockResolvedValue(user);

      bcrypt.compare
        .mockResolvedValueOnce(true) // old matches
        .mockResolvedValueOnce(false); // new different

      bcrypt.hash.mockResolvedValue("newHashedPassword");

      const error = new Sequelize.DatabaseError(new Error("db error"));
      modelMock.update.mockRejectedValue(error);

      await expect(
        repository.updatePassword(1, "oldPass", "newPassword")
      ).rejects.toThrow("Database error occurred.");
    });
  });


  describe("updateInfo", () => {
    test("updateInfo_MissingIdCredential_ThrowsRequiredError", async () => {
      await expect(
        repository.updateInfo(null, "user@example.com", "nick")
      ).rejects.toThrow("idCredential is required.");
    });

    test("updateInfo_EmailAlreadyExists_ThrowsEmailExistsError", async () => {
      const idCredential = 1;
      const email = "user@example.com";

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(true);

      await expect(
        repository.updateInfo(idCredential, email, "nick")
      ).rejects.toThrow("Email already exists.");

      expect(repository.isEmailTaken).toHaveBeenCalledWith(
        email.toLowerCase(),
        idCredential
      );
      expect(modelMock.update).not.toHaveBeenCalled();
    });

    test("updateInfo_NoUpdatesButCredentialExists_ReturnsSanitizedCurrent", async () => {
      const idCredential = 1;
      const instance = {
        get: jest.fn().mockReturnValue({
          credential_id: 1,
          email: "user@example.com",
          password_hash: "secret",
          nickname: "nick",
        }),
      };

      jest.spyOn(repository, "findById").mockResolvedValue(instance);

      const result = await repository.updateInfo(
        idCredential,
        undefined,
        undefined
      );

      expect(repository.findById).toHaveBeenCalledWith(idCredential);
      expect(result).toEqual({
        credential_id: 1,
        email: "user@example.com",
        nickname: "nick",
      });
    });

    test("updateInfo_NoUpdatesAndCredentialNotFound_ThrowsNotFoundError", async () => {
      const idCredential = 1;

      jest.spyOn(repository, "findById").mockResolvedValue(null);

      await expect(
        repository.updateInfo(idCredential, undefined, undefined)
      ).rejects.toThrow("Credential not found.");
    });

    test("updateInfo_UpdateEmailAndNickname_SuccessReturnsSanitizedUpdated", async () => {
      const idCredential = 1;
      const email = "New@Email.com";
      const nickname = "newNick";

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(false);

      const rowInstance = {
        get: jest.fn().mockReturnValue({
          credential_id: idCredential,
          email: email.toLowerCase(),
          password_hash: "secret",
          nickname,
        }),
      };

      modelMock.update.mockResolvedValue([1, [rowInstance]]);

      const result = await repository.updateInfo(
        idCredential,
        email,
        nickname
      );

      expect(modelMock.update).toHaveBeenCalledWith(
        {
          email: email.toLowerCase(),
          nickname,
          updatedAt: expect.any(Date),
        },
        {
          where: { credential_id: idCredential },
          returning: true,
        }
      );

      expect(result).toEqual({
        credential_id: idCredential,
        email: email.toLowerCase(),
        nickname,
      });
    });

    test("updateInfo_UpdateCredentialNotFound_ThrowsNotFoundError", async () => {
      const idCredential = 1;
      const email = "user@example.com";

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(false);

      modelMock.update.mockResolvedValue([0, []]);

      await expect(
        repository.updateInfo(idCredential, email, "nick")
      ).rejects.toThrow("Credential not found.");
    });

    test("updateInfo_DatabaseError_ThrowsDatabaseMessage", async () => {
      const idCredential = 1;
      const email = "user@example.com";

      jest.spyOn(repository, "isEmailTaken").mockResolvedValue(false);

      const error = new Sequelize.DatabaseError(new Error("db error"));
      modelMock.update.mockRejectedValue(error);

      await expect(
        repository.updateInfo(idCredential, email, "nick")
      ).rejects.toThrow("Database error occurred.");
    });
  });

  describe("updateLastLogin", () => {
    test("updateLastLogin_MissingIdCredential_ThrowsRequiredError", async () => {
      await expect(repository.updateLastLogin(null)).rejects.toThrow(
        "idCredential is required."
      );
    });

    test("updateLastLogin_CredentialNotFound_ThrowsNotFoundError", async () => {
      modelMock.update.mockResolvedValue([0, []]);

      await expect(repository.updateLastLogin(1)).rejects.toThrow(
        "Credential not found."
      );
    });

    test("updateLastLogin_ValidUpdate_ReturnsSanitizedCredential", async () => {
      const idCredential = 1;
      const when = new Date("2025-01-01T00:00:00Z");

      const rowInstance = {
        get: jest.fn().mockReturnValue({
          credential_id: idCredential,
          last_login: when,
          password_hash: "secret",
        }),
      };

      modelMock.update.mockResolvedValue([1, [rowInstance]]);

      const result = await repository.updateLastLogin(idCredential, when);

      expect(modelMock.update).toHaveBeenCalledWith(
        {
          last_login: when,
          updatedAt: expect.any(Date),
        },
        {
          where: { credential_id: idCredential },
          returning: true,
        }
      );

      expect(result).toEqual({
        credential_id: idCredential,
        last_login: when,
      });
    });

    test("updateLastLogin_DatabaseError_ThrowsDatabaseMessage", async () => {
      const error = new Sequelize.DatabaseError(new Error("db error"));

      modelMock.update.mockRejectedValue(error);

      await expect(repository.updateLastLogin(1)).rejects.toThrow(
        "Database error occurred."
      );
    });
  });
});
