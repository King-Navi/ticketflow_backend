import { Sequelize } from "sequelize";
import TicketCheckInModel from "../model_db/ticket_check_in.js";
import { sequelizeCon } from "../config/initPostgre.js";
import { CHECK_IN_STATUS } from "../model_db/utils/checkInStatus.js";

export default class TicketCheckInRepository {
  constructor(model = TicketCheckInModel, sequelize = sequelizeCon) {
    this.model = model;
    this.sequelize = sequelize;
  }

  async createCheckIn(
    {
      ticket_qr_id,
      check_in_status_id,
      scanner_id = null,
      scanned_at = undefined,
    },
    { transaction } = {}
  ) {
    if (!ticket_qr_id) {
      throw new Error("ticket_qr_id is required.");
    }
    if (!check_in_status_id) {
      throw new Error("check_in_status_id is required.");
    }

    try {
      const row = await this.model.create(
        {
          ticket_qr_id,
          check_in_status_id,
          scanner_id,
          ...(scanned_at ? { scanned_at } : {}),
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

  async findFirstSuccessfulCheckIn(ticketQrId, { transaction } = {}) {
    if (!ticketQrId) {
      throw new Error("ticketQrId is required.");
    }

    try {
      const row = await this.model.findOne({
        where: {
          ticket_qr_id: ticketQrId,
          check_in_status_id: CHECK_IN_STATUS.OK,
        },
        order: [["scanned_at", "ASC"]],
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

  async findAllByQrId(ticketQrId, { transaction } = {}) {
    if (!ticketQrId) {
      throw new Error("ticketQrId is required.");
    }

    try {
      const rows = await this.model.findAll({
        where: { ticket_qr_id: ticketQrId },
        order: [["scanned_at", "ASC"]],
        transaction,
      });

      return rows.map(r => r.get({ plain: true }));
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
