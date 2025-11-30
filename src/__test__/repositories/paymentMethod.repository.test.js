import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import PaymentMethodRepository from "../../repositories/paymentMethod.repository.js";

describe("PaymentMethodRepository (one test per function)", () => {
  let sequelizeMock;
  let repository;

  beforeEach(() => {
    sequelizeMock = {
      query: jest.fn(),
    };

    repository = new PaymentMethodRepository(sequelizeMock);
  });

  // createCardPaymentMethod
  test("createCardPaymentMethod_ValidData_ReturnsIds", async () => {
    const data = {
      attendee_id: 1,
      card_token: "tok_123",
      card_brand: "VISA",
      last4: "1234",
      exp_month: 12,
      exp_year: 2030,
    };

    const rows = [
      {
        payment_method_id: 10,
        card_id: 20,
      },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.createCardPaymentMethod(data);

    expect(result).toEqual({
      payment_method_id: 10,
      card_id: 20,
    });

    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);
    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        replacements: {
          p_attendee_id: 1,
          p_card_token: "tok_123",
          p_card_brand: "VISA",
          p_last4: "1234",
          p_exp_month: 12,
          p_exp_year: 2030,
        },
        type: Sequelize.QueryTypes.SELECT,
        transaction: undefined,
      })
    );
  });

  // findCardPaymentMethodsByAttendee
  test("findCardPaymentMethodsByAttendee_ValidAttendeeId_ReturnsRows", async () => {
    const attendeeId = 5;

    const rows = [
      {
        payment_method_id: 1,
        card_id: 11,
        card_brand: "VISA",
        last4: "1111",
        exp_month: 1,
        exp_year: 2030,
        created_at: new Date("2025-01-10T00:00:00Z"),
      },
      {
        payment_method_id: 2,
        card_id: 22,
        card_brand: "MC",
        last4: "2222",
        exp_month: 2,
        exp_year: 2031,
        created_at: new Date("2025-01-09T00:00:00Z"),
      },
    ];

    sequelizeMock.query.mockResolvedValue(rows);

    const result = await repository.findCardPaymentMethodsByAttendee(attendeeId);

    expect(result).toBe(rows);
    expect(sequelizeMock.query).toHaveBeenCalledTimes(1);

    const [, options] = sequelizeMock.query.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        replacements: { attendee_id: attendeeId },
        type: Sequelize.QueryTypes.SELECT,
      })
    );
  });
});
