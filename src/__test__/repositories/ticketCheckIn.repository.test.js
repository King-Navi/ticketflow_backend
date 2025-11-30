import { jest } from "@jest/globals";
import TicketCheckInRepository from "../../repositories/ticketCheckIn.repository";
import { CHECK_IN_STATUS } from "../../model_db/utils/checkInStatus";

describe("TicketCheckInRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    repository = new TicketCheckInRepository(modelMock, {});
  });

  // createCheckIn
  test("createCheckIn_ValidData_ReturnsPlainCheckIn", async () => {
    const scannedAt = new Date("2025-01-01T10:00:00Z");

    const data = {
      ticket_qr_id: 1,
      check_in_status_id: CHECK_IN_STATUS.OK,
      scanner_id: 42,
      scanned_at: scannedAt,
    };

    const plain = {
      ticket_check_in_id: 10,
      ...data,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.create.mockResolvedValue(instance);

    const result = await repository.createCheckIn(data);

    expect(modelMock.create).toHaveBeenCalledWith(
      {
        ticket_qr_id: 1,
        check_in_status_id: CHECK_IN_STATUS.OK,
        scanner_id: 42,
        scanned_at: scannedAt,
      },
      { transaction: undefined }
    );

    expect(result).toEqual(plain);
  });

  // findFirstSuccessfulCheckIn
  test("findFirstSuccessfulCheckIn_ValidQrId_ReturnsFirstOkCheckIn", async () => {
    const ticketQrId = 5;

    const plain = {
      ticket_check_in_id: 20,
      ticket_qr_id: ticketQrId,
      check_in_status_id: CHECK_IN_STATUS.OK,
      scanned_at: new Date("2025-01-01T10:00:00Z"),
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.findOne.mockResolvedValue(instance);

    const result = await repository.findFirstSuccessfulCheckIn(ticketQrId);

    expect(modelMock.findOne).toHaveBeenCalledWith({
      where: {
        ticket_qr_id: ticketQrId,
        check_in_status_id: CHECK_IN_STATUS.OK,
      },
      order: [["scanned_at", "ASC"]],
      transaction: undefined,
    });

    expect(result).toEqual(plain);
  });

  // findAllByQrId
  test("findAllByQrId_ValidQrId_ReturnsPlainArray", async () => {
    const ticketQrId = 7;

    const plain1 = {
      ticket_check_in_id: 1,
      ticket_qr_id: ticketQrId,
      check_in_status_id: CHECK_IN_STATUS.OK,
      scanned_at: new Date("2025-01-01T10:00:00Z"),
    };

    const plain2 = {
      ticket_check_in_id: 2,
      ticket_qr_id: ticketQrId,
      check_in_status_id: CHECK_IN_STATUS.DUPLICATE,
      scanned_at: new Date("2025-01-01T10:01:00Z"),
    };

    const row1 = { get: jest.fn().mockReturnValue(plain1) };
    const row2 = { get: jest.fn().mockReturnValue(plain2) };

    modelMock.findAll.mockResolvedValue([row1, row2]);

    const result = await repository.findAllByQrId(ticketQrId);

    expect(modelMock.findAll).toHaveBeenCalledWith({
      where: { ticket_qr_id: ticketQrId },
      order: [["scanned_at", "ASC"]],
      transaction: undefined,
    });

    expect(result).toEqual([plain1, plain2]);
  });
});
