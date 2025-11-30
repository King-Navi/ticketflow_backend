import { jest } from "@jest/globals";
import crypto from "node:crypto";
import bcrypt from "bcrypt";

import CredentialRepository from "../../repositories/credential.repository.js";
import PasswordResetTokenRepository from "../../repositories/passwordResetToken.repository.js";
import CredentialModel from "../../model_db/credential.js";

import {
  requestPasswordResetService,
  validatePasswordResetTokenService,
  performPasswordResetService,
} from "../../service/passwordReset.service.js"; // <-- ajusta si usas /services/

describe("Password reset services", () => {
  beforeAll(() => {
    process.env.SALT_ROUND = "4";
    process.env.MIN_RESET_PASSWORD_LENGTH = "8";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  test("requestPasswordResetService_ValidEmail_CreatesTokenAndReturnsRawToken", async () => {
    const email = "user@example.com";

    const fakeCredential = {
      credential_id: 10,
      email,
    };

    const findByEmailSpy = jest
      .spyOn(CredentialRepository.prototype, "findCredentialByEmail")
      .mockResolvedValue(fakeCredential);

    const createTokenSpy = jest
      .spyOn(PasswordResetTokenRepository.prototype, "createToken")
      .mockResolvedValue(1);

    const result = await requestPasswordResetService(email, "127.0.0.1", "JUnit");

    expect(findByEmailSpy).toHaveBeenCalledWith(email);
    expect(createTokenSpy).toHaveBeenCalledTimes(1);

    const arg = createTokenSpy.mock.calls[0][0];
    expect(arg.credential_id).toBe(fakeCredential.credential_id);
    expect(typeof arg.token_hash).toBe("string");
    expect(arg.token_hash.length).toBe(64);
    expect(arg.created_ip).toBe("127.0.0.1");
    expect(arg.created_ua).toBe("JUnit");

    expect(result).toHaveProperty("rawToken");
    expect(typeof result.rawToken).toBe("string");
    expect(result.rawToken.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("expiresAt");
    expect(result.expiresAt instanceof Date).toBe(true);
  });

  test("requestPasswordResetService_UnknownEmail_ThrowsNotFound", async () => {
    const email = "missing@example.com";

    jest
      .spyOn(CredentialRepository.prototype, "findCredentialByEmail")
      .mockResolvedValue(null);

    await expect(requestPasswordResetService(email)).rejects.toThrow(
      "Credential not found."
    );
  });


  test("validatePasswordResetTokenService_ValidToken_ReturnsIds", async () => {
    const tokenRaw = "Abc123XY-Z"; // 10 chars, cumple regex TOKEN_RE

    const fakeTokenRecord = {
      credential_id: 5,
      password_reset_token_id: 99,
    };

    const findValidSpy = jest
      .spyOn(PasswordResetTokenRepository.prototype, "findValidByHash")
      .mockResolvedValue(fakeTokenRecord);

    const result = await validatePasswordResetTokenService(tokenRaw);

    expect(findValidSpy).toHaveBeenCalledTimes(1);
    const [hashArg] = findValidSpy.mock.calls[0];
    expect(typeof hashArg).toBe("string");
    expect(hashArg.length).toBe(64);

    expect(result).toEqual({
      credential_id: 5,
      password_reset_token_id: 99,
    });
  });

  test("validatePasswordResetTokenService_InvalidFormatToken_ThrowsNotFound", async () => {
    const badToken = "short"; // longitud != 10

    await expect(
      validatePasswordResetTokenService(badToken)
    ).rejects.toThrow("Invalid or expired token.");
  });

  // ---------- performPasswordResetService ----------

  test("performPasswordResetService_ValidTokenAndPassword_UpdatesPasswordAndRevokesTokens", async () => {
    const tokenRaw = "Abc123XY-Z"; // válido para TOKEN_LEN=10
    const newPassword = "NewStrongPass";

    const tokenHash = crypto
      .createHash("sha256")
      .update(tokenRaw, "utf8")
      .digest("hex");

    const fakeTokenRecord = {
      password_reset_token_id: 101,
      credential_id: 7,
    };

    const fakeCredential = {
      credential_id: 7,
      email: "user@example.com",
      password_hash: "old-hash",
    };

    const findValidSpy = jest
      .spyOn(PasswordResetTokenRepository.prototype, "findValidByHash")
      .mockResolvedValue(fakeTokenRecord);

    const findByIdSpy = jest
      .spyOn(CredentialRepository.prototype, "findById")
      .mockResolvedValue(fakeCredential);

    const bcryptSpy = jest
      .spyOn(bcrypt, "hash")
      .mockResolvedValue("new-hash-value");

    const updateSpy = jest
      .spyOn(CredentialModel, "update")
      .mockResolvedValue([1]);

    const markUsedSpy = jest
      .spyOn(PasswordResetTokenRepository.prototype, "markUsed")
      .mockResolvedValue(true);

    const revokeSpy = jest
      .spyOn(PasswordResetTokenRepository.prototype, "revokeActiveForCredential")
      .mockResolvedValue(2);

    const result = await performPasswordResetService(tokenRaw, newPassword);

    expect(findValidSpy).toHaveBeenCalledWith(tokenHash);
    expect(findByIdSpy).toHaveBeenCalledWith(fakeTokenRecord.credential_id);
    expect(bcryptSpy).toHaveBeenCalledWith(newPassword, expect.any(Number));

    expect(updateSpy).toHaveBeenCalledWith(
      {
        password_hash: "new-hash-value",
        updated_at: expect.any(Date),
      },
      {
        where: { credential_id: fakeTokenRecord.credential_id },
      }
    );

    expect(markUsedSpy).toHaveBeenCalledWith(
      fakeTokenRecord.password_reset_token_id
    );
    expect(revokeSpy).toHaveBeenCalledWith(
      fakeTokenRecord.credential_id,
      fakeTokenRecord.password_reset_token_id
    );

    expect(result).toBe(true);
  });

  test("performPasswordResetService_ShortPassword_ThrowsBadRequest", async () => {
    const tokenRaw = "Abc123XY-Z";
    const shortPassword = "123"; // MIN_RESET_PASSWORD_LENGTH (8)

    await expect(
      performPasswordResetService(tokenRaw, shortPassword)
    ).rejects.toThrow("Password must be at least 8 characters long.");
  });
});
