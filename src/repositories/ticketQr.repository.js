import { Sequelize } from "sequelize";
import TicketQrModel from "../model_db/ticket_qr.js";
import { sequelizeCon } from "../config/initPostgre.js";

export default class TicketQrRepository {
  constructor(model = TicketQrModel, sequelize = sequelizeCon) {
    this.model = model;
    this.sequelize = sequelize;
  }

  async findByToken(token, { transaction } = {}) {
    if (!token) {
      throw new Error("token is required.");
    }

    try {
      const row = await this.model.findOne({
        where: { token },
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

  async findById(ticketQrId, { transaction } = {}) {
    if (!ticketQrId) {
      throw new Error("ticketQrId is required.");
    }

    try {
      const row = await this.model.findByPk(ticketQrId, { transaction });
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

  async findByTicketId(ticketId, { transaction } = {}) {
    if (!ticketId) {
      throw new Error("ticketId is required.");
    }

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
}
