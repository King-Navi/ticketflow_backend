
import { Op, Sequelize } from "sequelize";
import Credential from "../model_db/Credential.js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const SALT_ROUND = 12;

export default class CredentialRepository {
  constructor(model = Credential) {
    this.model = model;
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

    if (!user?.passwordHash) return false;
    console.log(plain)
    console.log(user.passwordHash)

    return bcrypt.compare(plain, user.passwordHash);

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
        passwordHash: hashedPassword,
        role,
      });

      return newCredential.idCredential;
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

}
