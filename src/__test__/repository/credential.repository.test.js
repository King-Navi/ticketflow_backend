import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockWhere = jest.fn((lhs, op, rhs) => ({ __type: "where", lhs, op, rhs }));
const mockFn = jest.fn((name, arg) => ({ __type: "fn", name, arg }));
const mockCol = jest.fn((name) => ({ __type: "col", name }));

class ConnectionError extends Error {}
class DatabaseError extends Error {}

jest.unstable_mockModule("sequelize", () => {
  const Op = { eq: Symbol("eq") };
  const SequelizeNS = {
    where: mockWhere,
    fn: mockFn,
    col: mockCol,
    ConnectionError,
    DatabaseError,
  };

  const defaultExport = { Op, Sequelize: SequelizeNS };

  return {
    Op,
    Sequelize: SequelizeNS,
    default: defaultExport,
  };
});

jest.unstable_mockModule("../../model_db/credential.js", () => {
  return {
    default: {},
  };
});

const { Op, Sequelize } = await import("sequelize");
const { default: CredentialRepository } = await import("../../repositories/credential.repository.js");

describe("CredentialRepository.findCredentialByNickName", () => {
  let model;
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    model = {
      findOne: jest.fn(),
    };
    repo = new CredentialRepository(model);
  });

  test("retorna el usuario cuando existe (búsqueda case-insensitive)", async () => {
    const fakeUser = { idCredential: 10, nickname: "MiNick", passwordHash: "hash" };
    model.findOne.mockResolvedValue(fakeUser);

    const result = await repo.findCredentialByNickName("MiNiCK");

    expect(model.findOne).toHaveBeenCalledTimes(1);
    const callArg = model.findOne.mock.calls[0][0];

    expect(callArg).toHaveProperty("where");
    expect(callArg.where).toMatchObject({
      __type: "where",
      op: Op.eq,
      lhs: { __type: "fn", name: "LOWER", arg: { __type: "col", name: "nickname" } },
      rhs: "minick",
    });

    expect(result).toBe(fakeUser);
  });

  test("retorna null cuando no encuentra usuario", async () => {
    model.findOne.mockResolvedValue(null);

    const result = await repo.findCredentialByNickName("inexistente");

    expect(model.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  test("lanza error legible cuando hay ConnectionError", async () => {
    model.findOne.mockRejectedValue(new Sequelize.ConnectionError("boom"));

    await expect(repo.findCredentialByNickName("nick"))
      .rejects.toThrow("Cannot connect to the database.");
  });

  test("lanza error legible cuando hay DatabaseError", async () => {
    model.findOne.mockRejectedValue(new Sequelize.DatabaseError(new Error("db")));

    await expect(repo.findCredentialByNickName("nick"))
      .rejects.toThrow("Database error occurred.");
  });
});
