import { sendEmail } from "../messaging/emailService.js"
import CredentialRepository from "../repositories/credential.repository.js";
import AttendeeRepository from "../repositories/attendee.repository.js";
import OrganizerRepository from "../repositories/organizer.repository.js";
import { BadRequest, NotFound, Unauthorized } from "../utils/errors/error.400.js";
import codeManager from "../utils/codeManager.js";
import { loginService } from "./login.service.js";
import { generateToken } from "../utils/jwt.js";
import { resolveUserRole, ROLE } from "../model_db/utils/role.js";

const credentialRepo = new CredentialRepository();
const attendeeRepo = new AttendeeRepository();
const organizerRepo = new OrganizerRepository();




/**
 * Handles user registration workflow.
 * 1. Creates a Credential.
 * 2. Depending on role, creates Attendee or Organizer.
 *
 * @async
 * @param {Object} data - Registration data.
 * @param {string} data.email - User email.
 * @param {string} data.nickname - Chosen nickname.
 * @param {string} data.passwordHash - Plain password (will be hashed).
 * @param {string} data.role - 'attendee' or 'organizer'.
 * @param {Object} [data.attendee] - Attendee details (if role === 'attendee').
 * @param {Object} [data.organizer] - Organizer details (if role === 'organizer').
 * @returns {Promise<Object>} The IDs created (credential + specific entity).
 *
 * @throws {Error} For invalid role or DB errors.
 */
export async function registerService(data) {
  const { email, nickname, passwordHash, role, attendee, organizer } = data;
  
  try {
    const credential_id = await credentialRepo.registerCredential({
      email,
      nickname,
      passwordHash,
      role,
    });

    let result = { credential_id: credential_id };

    if (role === "attendee" && attendee) {
      const idAttendee = await attendeeRepo.registerAttendee(
        attendee.firstName,
        attendee.lastName,
        attendee.middleName || null,
        credential_id
      );
      result.idAttendee = idAttendee;
    } else if (role === "organizer" && organizer) {
      const idOrganizer = await organizerRepo.registerOrganizer(
        organizer.firstName,
        organizer.lastName,
        organizer.middleName || null,
        credential_id,
        organizer.idCompany || null
      );
      result.idOrganizer = idOrganizer;
    } else {
      
      throw new BadRequest(`Invalid role or missing role-specific data: ${role}`);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Authenticate a user by nickname and password, resolve their role,
 * load the corresponding profile, and return a signed JWT.
 * Security note: this method throws generic `Unauthorized`/`NotFound` errors
 * to avoid leaking sensitive details during authentication.
 *
 * @param {string} username - User nickname (login identifier).
 * @param {string} password - Plain-text password to verify.
 * @returns {Promise<string>} A signed JWT string containing user id, email, nickname, first name, and role code.
 *
 * @throws {NotFound} If the credential does not exist or the user profile cannot be found.
 * @throws {Unauthorized} If the password is invalid or the resolved role is unsupported.
 *
 * @example
 * ```js
 * try {
 *   const token = await loginService('john_doe', 'P@ssw0rd!');
 *   // Use token in Authorization header: `Bearer ${token}`
 * } catch (err) {
 *   if (err instanceof Unauthorized) {
 *     // handle invalid credentials
 *   }
 *   if (err instanceof NotFound) {
 *     // handle missing user/profile
 *   }
 * }
 * ```
 */
export async function recoverEmailService({ email, code }) {
  try {
    const emailExists = await credentialRepo.isEmailTaken(email)
    if (!emailExists) {
      throw new NotFound("Email not found")
    }
    const isValidCode = codeManager.verifyEmailCode(email, code);
    if (!isValidCode) {
      throw new Unauthorized("Invalid credentials")
    }
    const credential = await credentialRepo.findCredentialByEmail(email);
    const { roleName, roleCode } = resolveUserRole(credential);
    let userProfile = null;
    switch (roleName) {
      case ROLE.ATTENDEE:
        userProfile = await attendeeRepo.findAttendeeByCredentialId(credential.credential_id);
        break;
      case ROLE.ORGANIZER:
        userProfile = await organizerRepo.findOrganizerByCredentialId(credential.credential_id);
        break;
      case ROLE.ADMIN:
        userProfile = { idAdmin: credential.credential_id, firstName: credential.nickname };
        break;
      default:
        throw new Unauthorized("Unsupported role");
    }
    if (!userProfile) throw new NotFound("User profile not found");
    const idUser = userProfile.idAttendee || userProfile.idOrganizer || userProfile.idAdmin;
    return generateToken(
      idUser,
      credential.email,
      credential.nickname,
      userProfile.firstName,
      roleCode,
      "1h"
    );

  } catch (error) {
    throw error;
  }
}

export async function sendRecoverCodeToEmailService(email) {
  try {
    const emailExists = await credentialRepo.isEmailTaken(email)
    if (!emailExists) {
      throw new NotFound("Email not found")
    }
    const code = codeManager.storeCode(email);
    if (process.env.DEBUG === 'true') {
      console.log(code)
    }
    await sendEmail({
      to: email,
      subject: "Código de recuperación de cuenta",
      text: `Tu código de recuperación es: ${code}\nEste código expirará en 10 minutos.`,
    });
  } catch (error) {
    throw error;
  }
}
