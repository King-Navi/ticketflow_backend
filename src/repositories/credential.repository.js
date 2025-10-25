
import { Op, Sequelize } from "sequelize";
import Credential from "../model_db/Credential.js";

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
   * @param {string} passwordHash - The encrypted or hashed password to compare.
   * @returns {Promise<boolean>} Returns `true` if the password matches, or `false` if it doesn't or if the user is not found.
   * 
   * @throws {Error} Throws a connection error if the database is unreachable.
   * @throws {Error} Throws a database error for invalid queries or schema issues.
   */
  async isValidPassword(nickname, passwordHash) {
    try {
      const user = await this.model.findOne({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('nickname')),
          Op.eq,
          nickname.toLowerCase()
        ),
      });

      if (!user) {
        return false;
      }

      const isMatch = user.passwordHash === passwordHash;

      return isMatch;
    } catch (error) {
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error('Cannot connect to the database.');
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error('Database error occurred.');
      }
      throw error;
    }
  }
}
