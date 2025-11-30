import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import PasswordResetTokenRepository from "../../repositories/passwordResetToken.repository.js";

const { Op } = Sequelize;

describe("PasswordResetTokenRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };

    repository = new PasswordResetTokenRepository(modelMock);
  });

  // createToken
  test("createToken_ValidParams_ReturnsNewTokenId", async () => {
    const params = {
      credential_id: 1,
      token_hash: "a".repeat(64),
      expires_at: new Date("2025-01-01T00:00:00Z"),
      created_ip: "127.0.0.1",
      created_ua: "Mozilla/5.0",
    };

    const rec = {
      password_reset_token_id: 10,
      ...params,
    };

    modelMock.create.mockResolvedValue(rec);

    const result = await repository.createToken(params);

    expect(result).toBe(10);
    expect(modelMock.create).toHaveBeenCalledWith({
      credential_id: 1,
      token_hash: "a".repeat(64),
      expires_at: params.expires_at,
      created_ip: "127.0.0.1",
      created_ua: "Mozilla/5.0",
    });
  });

  // findValidByHash
  test("findValidByHash_ValidUnusedNonExpiredToken_ReturnsToken", async () => {
    const tokenHash = "b".repeat(64);
    const tokenRow = { password_reset_token_id: 5, token_hash: tokenHash };

    modelMock.findOne.mockResolvedValue(tokenRow);

    const result = await repository.findValidByHash(tokenHash);

    expect(result).toBe(tokenRow);
    expect(modelMock.findOne).toHaveBeenCalledTimes(1);

    const arg = modelMock.findOne.mock.calls[0][0];
    expect(arg.where.token_hash).toBe(tokenHash);
    expect(arg.where.used_at[Op.is]).toBeNull();
    expect(arg.where.expires_at[Op.gt]).toBeInstanceOf(Date);
    expect(arg.order).toEqual([["expires_at", "DESC"]]);
  });

  // markUsed
  test("markUsed_ExistingToken_ReturnsTrue", async () => {
    const tokenId = 7;
    modelMock.update.mockResolvedValue([1]);

    const result = await repository.markUsed(tokenId);

    expect(result).toBe(true);
    expect(modelMock.update).toHaveBeenCalledWith(
      {
        used_at: expect.any(Date),
        updatedAt: expect.any(Date),
      },
      {
        where: { password_reset_token_id: tokenId },
      }
    );
  });

  // revokeActiveForCredential
  test("revokeActiveForCredential_WithoutExceptToken_UpdatesAndReturnsCount", async () => {
    const credentialId = 3;
    modelMock.update.mockResolvedValue([4]); // 4 filas “revocadas”

    const result = await repository.revokeActiveForCredential(credentialId, undefined);

    expect(result).toBe(4);
    expect(modelMock.update).toHaveBeenCalledTimes(1);

    const arg = modelMock.update.mock.calls[0][1]; // segundo argumento: { where }
    const where = arg.where;
    expect(where.credential_id).toBe(credentialId);
    expect(where.used_at[Op.is]).toBeNull();
    expect(where.expires_at[Op.gt]).toBeInstanceOf(Date);
    expect(where).not.toHaveProperty("password_reset_token_id");
  });

  // findLatestActiveByCredential
  test("findLatestActiveByCredential_ReturnsLatestActiveToken", async () => {
    const credentialId = 8;
    const row = { password_reset_token_id: 12, credential_id: credentialId };

    modelMock.findOne.mockResolvedValue(row);

    const result = await repository.findLatestActiveByCredential(credentialId);

    expect(result).toBe(row);
    expect(modelMock.findOne).toHaveBeenCalledTimes(1);

    const arg = modelMock.findOne.mock.calls[0][0];
    const where = arg.where;

    expect(where.credential_id).toBe(credentialId);
    expect(where.used_at[Op.is]).toBeNull();
    expect(where.expires_at[Op.gt]).toBeInstanceOf(Date);
    expect(arg.order).toEqual([["expires_at", "DESC"]]);
  });

  // purgeExpired
  test("purgeExpired_DeletesTokensUntilGivenDate_ReturnsDeletedCount", async () => {
    const until = new Date("2025-01-01T00:00:00Z");
    modelMock.destroy.mockResolvedValue(5);

    const result = await repository.purgeExpired(until);

    expect(result).toBe(5);
    expect(modelMock.destroy).toHaveBeenCalledWith({
      where: {
        expires_at: {
          [Op.lte]: until,
        },
      },
    });
  });

  // countActive
  test("countActive_ValidCredentialId_ReturnsCount", async () => {
    const credentialId = 9;
    modelMock.count.mockResolvedValue(2);

    const result = await repository.countActive(credentialId);

    expect(result).toBe(2);
    expect(modelMock.count).toHaveBeenCalledTimes(1);

    const arg = modelMock.count.mock.calls[0][0];
    const where = arg.where;

    expect(where.credential_id).toBe(credentialId);
    expect(where.used_at[Op.is]).toBeNull();
    expect(where.expires_at[Op.gt]).toBeInstanceOf(Date);
  });
});
