import { sendEmail } from "../messaging/emailService.js"
import CredentialRepository from "../repositories/credential.repository.js";
import AttendeeRepository from "../repositories/attendee.repository.js";
import OrganizerRepository from "../repositories/organizer.repository.js";
import { BadRequest, NotFound, Unauthorized } from "../utils/errors/error.400.js";
import codeManager from "../utils/codeManager.js";

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
    const idCredential = await credentialRepo.registerCredential({
      email,
      nickname,
      passwordHash,
      role,
    });

    let result = { idCredential };

    if (role === "attendee" && attendee) {
      const idAttendee = await attendeeRepo.registerAttendee(
        attendee.firstName,
        attendee.lastName,
        attendee.middleName || null,
        idCredential
      );
      result.idAttendee = idAttendee;
    } else if (role === "organizer" && organizer) {
      const idOrganizer = await organizerRepo.registerOrganizer(
        organizer.firstName,
        organizer.lastName,
        organizer.middleName || null,
        idCredential,
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

//TODO: It needs to return a JWT with the email associate
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
    
    return true;

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
    await sendEmail({
      to: email,
      subject: "Código de recuperación de cuenta",
      text: `Tu código de recuperación es: ${code}\nEste código expirará en 10 minutos.`,
    });
  } catch (error) {
    throw error;
  }
}
