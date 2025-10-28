import { generateToken } from '../utils/jwt.js'
import { NotFound, Unauthorized } from '../utils/errors/error.400.js'
import CredentialRepository from '../repositories/credential.repository.js';
import AttendeeRepository from '../repositories/attendee.repository.js';
import OrganizerRepository from "../repositories/organizer.repository.js";
import { resolveUserRole, ROLE } from '../model_db/utils/role.js'

const organizerRepo = new OrganizerRepository();
const attendeeRepo = new AttendeeRepository();
const credentialRepo = new CredentialRepository();


export async function loginService(username, password) {
  let credential = await credentialRepo.findCredentialByNickName(username);

  if (!credential) {
    throw new NotFound("User not found");
  }
  const isPasswordValid = await credentialRepo.isValidPassword(username, password);
  if (!isPasswordValid) {
    throw new Unauthorized("Invalid credentials");
  }
  const { roleName, roleCode } = resolveUserRole(credential);
  let userProfile = null;
  switch (roleName) {
    case ROLE.ATTENDEE:
      userProfile = await attendeeRepo.findAttendeeByCredentialId(credential.idCredential);
      break;
    case ROLE.ORGANIZER:
      userProfile = await organizerRepo.findOrganizerByCredentialId(credential.idCredential);
      break;
    case ROLE.ADMIN:
      userProfile = { idAdmin: credential.idCredential, firstName: credential.nickname };
      break;
    default:
      throw new Unauthorized("Unsupported role");
  }
  if (!userProfile) throw new NotFound("User profile not found");
  const idUser = userProfile.idAttendee || userProfile.idOrganizer || userProfile.idAdmin;
  
  await credentialRepo.updateLastLogin(credential.idCredential);
  
  return generateToken(
    idUser,
    credential.email,
    credential.nickname,
    userProfile.firstName,
    roleCode
  );

}
