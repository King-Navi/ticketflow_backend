import { jest } from "@jest/globals";
import RefundRepository from "../../repositories/refund.repository.js";

describe("RefundRepository (one test per function)", () => {
  let modelMock;
  let repository;

  beforeEach(() => {
    modelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };


    repository = new RefundRepository(modelMock, {});
  });

  // findByTicketId
  test("findByTicketId_ValidTicketId_ReturnsPlainRefund", async () => {
    const ticketId = 123;

    const plain = {
      refund_id: 1,
      ticket_id: ticketId,
      refund_amount: 100,
      reason: "Customer request",
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

  // createRefund
  test("createRefund_ValidData_ReturnsPlainRefund", async () => {
    const data = {
      ticket_id: 123,
      refund_amount: 50,
      reason: "Event canceled",
      refund_status_id: 1,
      policy_code: "POLICY-A",
    };

    const plain = {
      refund_id: 10,
      ...data,
    };

    const instance = {
      get: jest.fn().mockReturnValue(plain),
    };

    modelMock.create.mockResolvedValue(instance);

    const result = await repository.createRefund(data);

    expect(modelMock.create).toHaveBeenCalledWith(
      {
        ticket_id: 123,
        refund_amount: 50,
        reason: "Event canceled",
        refund_status_id: 1,
        policy_code: "POLICY-A",
      },
      { transaction: undefined }
    );
    expect(result).toEqual(plain);
  });

  // updateStripeInfoAndStatus
  test("updateStripeInfoAndStatus_ValidData_CallsUpdate", async () => {
    const refundId = 7;
    const updateData = {
      refund_status_id: 2,
      stripe_refund_id: "re_123",
      stripe_refund_status_raw: "succeeded",
    };

    modelMock.update.mockResolvedValue([1]);

    await repository.updateStripeInfoAndStatus(refundId, updateData);

    expect(modelMock.update).toHaveBeenCalledWith(
      {
        refund_status_id: 2,
        stripe_refund_id: "re_123",
        stripe_refund_status_raw: "succeeded",
        updated_at: expect.any(Date),
      },
      {
        where: { refund_id: refundId },
        transaction: undefined,
      }
    );
  });
});
