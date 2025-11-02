
import { Op, Sequelize } from "sequelize";
import Credential from "../model_db/credential.js";
import bcrypt from "bcrypt";

const SALT_ROUND = Number(process.env.SALT_ROUND);
const MIN_LENGTH_PASSWORD = 6;

export default class CredentialRepository {
  constructor(model = Credential) {
    this.model = model;
  }

  /**
   * Internal helper: returns a plain JS object without sensitive fields like password_hash.
   * @param {Model|null} credentialInstance
   * @returns {Object|null}
   */
  _sanitize(credentialInstance) {
    if (!credentialInstance) return null;
    const plain = credentialInstance.get({ plain: true });
    delete plain.password_hash;
    return plain;
  }

  /**
   * Find credential by PK (credential_id).
   * @param {number} credentialId
   * @returns {Promise<Model|null>}
   */
  async findById(credentialId) {
    try {
      return await this.model.findByPk(credentialId);
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
   * Finds a credential (user) by their nickname.
   *
   * Performs a case-insensitive lookup using Sequelize's LOWER() function.
   *
   * @async
   * @param {string} nickname - The user's nickname to search for.
   * @returns {Promise<Object|null>} Returns the found user record, or `null` if no user is found.
   * 
   * @throws {Error} Throws a connection error if the database is unreachable.
   * @throws {Error} Throws a database error for invalid queries or schema issues.
   */
  async findCredentialByNickName(nickname) {
    try {
      let user = await this.model.findOne({
        where: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("nickname")),
          Op.eq,
          nickname.toLowerCase()
        ),
      });

      return user;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error
    }
  }

  /**
   * Finds a credential by email (case-insensitive).
   *
   * @param {string} email
   * @returns {Promise<Model|null>}
   */
  async findCredentialByEmail(email) {
    try {
      let user = await this.model.findOne({
        where: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("email")),
          Op.eq,
          email.toLowerCase()
        ),
      });

      return user;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred.");
      }
      throw error
    }
  }

  /**
   * Validates whether the provided password hash matches the stored one for a given nickname.
   *
   * This method assumes that the incoming password is already encrypted or hashed on the client side.
   * It does a direct comparison between the provided hash and the stored hash in the database.
   *
   * @async
   * @param {string} nickname - The nickname of the user whose password should be verified.
   * @param {string} plain - The encrypted or hashed password to compare.
   * @returns {Promise<boolean>} Returns `true` if the password matches, or `false` if it doesn't or if the user is not found.
   * 
   * @throws {Error} Throws a connection error if the database is unreachable.
   * @throws {Error} Throws a database error for invalid queries or schema issues.
   */
  async isValidPassword(nickname, plain) {
    const user = await this.findCredentialByNickName(nickname);

    if (!user?.password_hash) return false;

    return bcrypt.compare(plain, user.password_hash);

  }


  /**
   * Registers a new credential (user account).
   *
   * Hashes the password, validates uniqueness of email and nickname,
   * and stores a new record in the "Credential" table.
   *
   * @async
   * @param {Object} data - Credential data.
   * @param {string} data.email - The user's email address.
   * @param {string} data.nickname - The user's chosen nickname.
   * @param {string} data.passwordHash - Plain password (will be hashed before saving).
   * @param {string} data.role - The user's role ('attendee', 'organizer', or 'admin').
   * @returns {Promise<number>} The ID of the newly created credential.
   *
   * @throws {Error} If email or nickname already exist, or a database error occurs.
   */
  async registerCredential({ email, nickname, passwordHash, role }) {
    try {
      const normalizedEmail = email.toLowerCase();
      if (await this.isEmailTaken(normalizedEmail)) {
        throw new Error("Email already exists.");
      }

      const saltRounds = SALT_ROUND;
      const hashedPassword = await bcrypt.hash(passwordHash, saltRounds);

      const newCredential = await this.model.create({
        email: normalizedEmail,
        nickname,
        password_hash: hashedPassword,
        role,
      });

      return newCredential.credential_id;
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
   * Checks if an email is already registered in the Credential table.
   *
   * Performs a case-insensitive search.
   *
   * @async
   * @param {string} email - The email to verify.
   * @returns {Promise<boolean>} Returns `true` if the email is already in use, `false` otherwise.
   *
   * @throws {Error} Throws a connection error if the database is unreachable.
   * @throws {Error} Throws a database error for invalid queries or schema issues.
   */
  async isEmailTaken(email) {
    try {
      const normalizedEmail = email.toLowerCase();

      const existing = await this.model.findOne({
        where: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("email")),
          normalizedEmail
        ),
      });

      return !!existing;
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
   * 
   * @param {int} idCredential 
   * @param {string} oldPassword 
   * @param {string} newPassword 
   * @returns {Promise<boolean>} true if updated
   */
  async updatePassword(idCredential, oldPassword, newPassword) {
    try {
      if (!idCredential) throw new Error("idCredential is required.");
      if (!oldPassword || !newPassword) throw new Error("Both oldPassword and newPassword are required.");
      if (newPassword.length < MIN_LENGTH_PASSWORD) throw new Error("New password must be at least 8 characters.");

      const user = await this.findById(idCredential);
      if (!user) throw new Error("Credential not found.");

      const matches = await bcrypt.compare(oldPassword, user.password_hash || "");
      if (!matches) throw new Error("Old password is incorrect.");

      const sameAsBefore = await bcrypt.compare(newPassword, user.password_hash || "");
      if (sameAsBefore) throw new Error("New password cannot be the same as the current password.");

      const hashed = await bcrypt.hash(newPassword, SALT_ROUND);

      await this.model.update(
        { password_hash: hashed, updatedAt: new Date() },
        { where: { credential_id: idCredential }, returning: false, }
      );

      return true;
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

  async updateInfo(idCredential, email, nickname) {
    try {
      if (!idCredential) throw new Error("idCredential is required.");

      const updates = {};
      if (typeof email !== "undefined" && email !== null) {
        const normalized = String(email).toLowerCase();
        if (await this.isEmailTaken(normalized, idCredential)) {
          throw new Error("Email already exists.");
        }
        updates.email = normalized;
      }
      if (typeof nickname !== "undefined") {
        updates.nickname = nickname;
      }

      if (Object.keys(updates).length === 0) {
        const current = await this.findById(idCredential);
        if (!current) throw new Error("Credential not found.");
        return this.sanitize(current);
      }

      const [count, rows] = await this.model.update(
        { ...updates, updatedAt: new Date() },
        { where: { credential_id: idCredential }, returning: true }
      );

      if (count === 0) throw new Error("Credential not found.");
      return this.sanitize(rows[0]);
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

  async updateLastLogin(credential_id, when = new Date()) {
    try {
      if (!credential_id) throw new Error("idCredential is required.");

      const [count, rows] = await this.model.update(
        { last_login: when, updatedAt: new Date() },
        { where: { credential_id: credential_id }, returning: true }
      );

      if (count === 0) throw new Error("Credential not found.");
      return this._sanitize(rows[0]);
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
