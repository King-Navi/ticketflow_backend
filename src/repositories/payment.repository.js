import { Sequelize } from "sequelize";
import Payment from "../model_db/payment.js";

export default class PaymentRepository {
  constructor(model = Payment) {
    this.model = model;
  }

  /**
   * Crea un payment
   * @param {{
   *   subtotal: number,
   *   tax_percentage: number,
   *   tax_amount: number,
   *   total_amount: number,
   *   ticket_quantity: number,
   *   payment_method_id: number,
   *   reservation_id?: number
   * }} data
   * @param {{ transaction?: import('sequelize').Transaction }} [options]
   * @returns {Promise<number>} payment_id
   */
  async createPayment(data, { transaction } = {}) {
    const {
      subtotal,
      tax_percentage,
      tax_amount,
      total_amount,
      ticket_quantity,
      payment_method_id,
      attendee_id,
      stripe_payment_intent_id
    } = data || {};

    if (subtotal == null) throw new Error("subtotal is required.");
    if (tax_percentage == null) throw new Error("tax_percentage is required.");
    if (tax_amount == null) throw new Error("tax_amount is required.");
    if (total_amount == null) throw new Error("total_amount is required.");
    if (!ticket_quantity || ticket_quantity <= 0) {
      throw new Error("ticket_quantity must be greater than 0.");
    }
    
    if (!attendee_id) {
      throw new Error("attendee_id is required.");
    }

    try {
      const rec = await this.model.create(
        {
          subtotal,
          tax_percentage,
          tax_amount,
          total_amount,
          ticket_quantity,
          payment_method_id: payment_method_id || null,
          attendee_id,
          stripe_payment_intent_id
        },
        { transaction }
      );

      return rec.payment_id;

    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }

  /**
   * @param {number} paymentId
   * @returns {Promise<any>}
   */
  async findById(paymentId) {
    try {
      return await this.model.findByPk(paymentId);
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error;
    }
  }
}
