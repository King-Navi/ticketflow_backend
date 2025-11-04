import { Op, Sequelize } from "sequelize";
import PasswordResetTokenModel from "../model_db/password_reset_token.js";

export default class PasswordResetTokenRepository {
  constructor(model = PasswordResetTokenModel) {
    this.model = model;
  }

  /**
   * Create a reset token record (hash-only) for a credential.
   * @param {Object} params
   * @param {number} params.credential_id
   * @param {string} params.token_hash  - 64 hex chars (SHA-256)
   * @param {Date}   params.expires_at
   * @param {string|undefined} params.created_ip
   * @param {string|undefined} params.created_ua
   * @returns {Promise<number>} password_reset_token_id
   */
  async createToken({ credential_id, token_hash, expires_at, created_ip, created_ua }) {
    try {
      const rec = await this.model.create({
        credential_id,
        token_hash,
        expires_at,
        created_ip: created_ip ?? null,
        created_ua: created_ua ? String(created_ua).slice(0, 300) : null,
      });
      return rec.password_reset_token_id;
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
   * Find a VALID token by its hash (unused and not expired).
   * @param {string} token_hash
   * @returns {Promise<Model|null>}
   */
  async findValidByHash(token_hash) {
    try {
      return await this.model.findOne({
        where: {
          token_hash,
          used_at: { [Op.is]: null },
          expires_at: { [Op.gt]: new Date() },
        },
        order: [["expires_at", "DESC"]],
      });
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
   * Mark a token as used now (one-time use).
   * @param {number} password_reset_token_id
   * @returns {Promise<boolean>} true if updated
   */
  async markUsed(password_reset_token_id) {
    try {
      const [count] = await this.model.update(
        { used_at: new Date(), updatedAt: new Date() },
        { where: { password_reset_token_id } }
      );
      return count > 0;
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
   * Revoke (invalidate) all active tokens for a credential (except optionally one).
   * Useful after a successful reset to invalidate other links.
   * @param {number} credential_id
   * @param {number|undefined} exceptTokenId
   * @returns {Promise<number>} number of rows updated
   */
  async revokeActiveForCredential(credential_id, exceptTokenId) {
    try {
      const where = {
        credential_id,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      };
      if (exceptTokenId) {
        where.password_reset_token_id = { [Op.ne]: exceptTokenId };
      }

      const [count] = await this.model.update(
        { expires_at: new Date(), updatedAt: new Date() },
        { where }
      );
      return count;
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
   * Get the latest active token for a credential (if any).
   * @param {number} credential_id
   * @returns {Promise<Model|null>}
   */
  async findLatestActiveByCredential(credential_id) {
    try {
      return await this.model.findOne({
        where: {
          credential_id,
          used_at: { [Op.is]: null },
          expires_at: { [Op.gt]: new Date() },
        },
        order: [["expires_at", "DESC"]],
      });
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
   * Hard-delete expired tokens (maintenance).
   * @param {Date} [until=new Date()] delete tokens with expires_at <= until
   * @returns {Promise<number>} rows deleted
   */
  async purgeExpired(until = new Date()) {
    try {
      return await this.model.destroy({
        where: { expires_at: { [Op.lte]: until } },
      });
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
   * Count active tokens for a credential (optional helper).
   * @param {number} credential_id
   * @returns {Promise<number>}
   */
  async countActive(credential_id) {
    try {
      return await this.model.count({
        where: {
          credential_id,
          used_at: { [Op.is]: null },
          expires_at: { [Op.gt]: new Date() },
        },
      });
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
