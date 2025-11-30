import { jest } from "@jest/globals";
import TicketQrRepository from "../../repositories/ticketQr.repository";

describe("TicketQrRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
    };

    // No usamos sequelize en estos métodos, así que podemos pasar un mock vacío
    repository = new TicketQrRepository(modelMock, {});
  });

  test("findByToken_ValidToken_ReturnsPlainTicketQr", async () => {
    const token = "abc123";

    const plain = {
      ticket_qr_id: 10,
      token,
      ticket_id: 5,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findByToken(token);

    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { token },
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });

  test("findById_ValidId_ReturnsPlainTicketQr", async () => {
    const ticketQrId = 7;

    const plain = {
      ticket_qr_id: ticketQrId,
      token: "xyz789",
      ticket_id: 2,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findByPk.mockResolvedValue(instance);

    const result = await repository.findById(ticketQrId);

    expect(modelMock.findByPk).toHaveBeenCalledWith(ticketQrId, {
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });

  test("findByTicketId_ValidTicketId_ReturnsPlainTicketQr", async () => {
    const ticketId = 15;

    const plain = {
      ticket_qr_id: 20,
      token: "qr-token-123",
      ticket_id: ticketId,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findByTicketId(ticketId);

    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: { ticket_id: ticketId },
      transaction: undefined,
    });
    expect(result).toEqual(plain);
  });
});
