import { Sequelize } from "sequelize";
import Refund from "../model_db/refund.js";
import { sequelizeCon } from "../config/initPostgre.js";

export default class RefundRepository {
  constructor(model = Refund, sequelize = sequelizeCon) {
    this.model = model;
    this.sequelize = sequelize;
  }

  async findByTicketId(ticketId, { transaction } = {}) {
    if (!ticketId) throw new Error("ticketId is required.");

    try {
      const row = await this.model.findOne({
        where: { ticket_id: ticketId },
        transaction,
      });
      return row ? row.get({ plain: true }) : null;
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

  async createRefund(
    { ticket_id, refund_amount, reason, refund_status_id, policy_code },
    { transaction } = {}
  ) {
    if (!ticket_id) throw new Error("ticket_id is required.");
    if (refund_amount == null) throw new Error("refund_amount is required.");
    if (!reason) throw new Error("reason is required.");
    if (!refund_status_id) throw new Error("refund_status_id is required.");

    try {
      const row = await this.model.create(
        {
          ticket_id,
          refund_amount,
          reason,
          refund_status_id,
          policy_code: policy_code ?? null,
        },
        { transaction }
      );
      return row.get({ plain: true });
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

  async updateStripeInfoAndStatus(
    refundId,
    { refund_status_id, stripe_refund_id, stripe_refund_status_raw },
    { transaction } = {}
  ) {
    if (!refundId) throw new Error("refundId is required.");

    try {
      await this.model.update(
        {
          refund_status_id,
          stripe_refund_id: stripe_refund_id ?? null,
          stripe_refund_status_raw: stripe_refund_status_raw ?? null,
          updated_at: new Date(),
        },
        {
          where: { refund_id: refundId },
          transaction,
        }
      );
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