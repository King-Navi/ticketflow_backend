import { Sequelize } from "sequelize";

export default class PaymentMethodRepository {
  constructor(sequelize) {
    if (!sequelize) {
      throw new Error("sequelize instance is required.");
    }
    this.sequelize = sequelize;
  }

  /**
   * Creates a payment_method + card using the Postgres stored procedure
   * `create_card_with_payment_method`.
   *
   * @param {{
   *   attendee_id: number,
   *   card_token: string,
   *   card_brand: string,
   *   last4: string,
   *   exp_month: number,
   *   exp_year: number
   * }} data
   * @param {{ transaction?: import("sequelize").Transaction }} [options]
   * @returns {Promise<{ payment_method_id: number, card_id: number }>}
   */
  async createCardPaymentMethod(data, { transaction } = {}) {
    const {
      attendee_id,
      card_token,
      card_brand,
      last4,
      exp_month,
      exp_year,
    } = data || {};

    // Basic validations (before hitting DB)
    if (!attendee_id) throw new Error("attendee_id is required.");
    if (!card_token) throw new Error("card_token is required.");
    if (!card_brand) throw new Error("card_brand is required.");

    if (!last4) {
      throw new Error("last4 is required.");
    }
    if (String(last4).length !== 4) {
      throw new Error("last4 must be a 4-character string.");
    }

    if (exp_month == null) throw new Error("exp_month is required.");
    if (exp_year == null) throw new Error("exp_year is required.");

    try {
      const rows = await this.sequelize.query(
        `
          SELECT payment_method_id, card_id
          FROM create_card_with_payment_method(
            :p_attendee_id,
            :p_card_token,
            :p_card_brand,
            :p_last4,
            :p_exp_month,
            :p_exp_year
          )
        `,
        {
          replacements: {
            p_attendee_id: attendee_id,
            p_card_token: card_token,
            p_card_brand: card_brand,
            p_last4: String(last4),
            p_exp_month: exp_month,
            p_exp_year: exp_year,
          },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (!rows || rows.length === 0) {
        throw new Error(
          "Stored procedure create_card_with_payment_method did not return any row."
        );
      }

      const { payment_method_id, card_id } = rows[0];

      return { payment_method_id, card_id };
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }

      if (error instanceof Sequelize.DatabaseError) {
        // If the stored procedure raises foreign_key_violation for attendee
        if (error.original?.code === "23503") {
          throw new Error("Attendee does not exist or is invalid.");
        }

        throw new Error(
          "Database error occurred while creating payment method with card."
        );
      }

      throw error;
    }
  }

  /**
   * Optional helper: returns all card payment methods for an attendee.
   *
   * @param {number} attendeeId
   * @returns {Promise<Array<{
   *   payment_method_id: number,
   *   card_id: number,
   *   card_brand: string,
   *   last4: string,
   *   exp_month: number,
   *   exp_year: number,
   *   created_at: Date
   * }>>}
   */
  async findCardPaymentMethodsByAttendee(attendeeId) {
    if (!attendeeId) throw new Error("attendeeId is required.");

    try {
      const rows = await this.sequelize.query(
        `
          SELECT
            pm.payment_method_id,
            c.card_id,
            c.card_brand,
            c.last4,
            c.exp_month,
            c.exp_year,
            pm.created_at
          FROM payment_method pm
          JOIN card c ON c.payment_method_id = pm.payment_method_id
          WHERE pm.attendee_id = :attendee_id
          ORDER BY pm.created_at DESC
        `,
        {
          replacements: { attendee_id: attendeeId },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      return rows;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error(
          "Database error occurred while fetching payment methods."
        );
      }
      throw error;
    }
  }
}
