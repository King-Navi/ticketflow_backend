import OrganizerRepository from "../repositories/organizer.repository.js";

const organizerRepo = new OrganizerRepository();


export async function updateOrganizerProfileService(credentialId, payload = {}) {
  if (!credentialId) {
    throw new Error("Unauthorized.");
  }

  const {
    first_name,
    last_name,
    middle_name,
    company_id,
  } = payload;

  const updates = {};
  if (typeof first_name !== "undefined")   updates.first_name   = first_name;
  if (typeof last_name !== "undefined")    updates.last_name    = last_name;
  if (typeof middle_name !== "undefined")  updates.middle_name  = middle_name;
  if (typeof company_id !== "undefined")   updates.company_id   = company_id;

  const updated = await organizerRepo.updateOrganizerInfoByCredentialId(
    credentialId,
    updates
  );
  return updated;
}


/**
 * Retrieves basic organizer info (separated names and company_id)
 * for a given credentialId.
 *
 * @param {number} credentialId
 * @returns {Promise<{first_name: string, middle_name: string|null, last_name: string, company_id: number|null}>}
 *
 * @throws {Error} If unauthorized or organizer not found.
 */
export async function getOrganizerBasicInfoService(credentialId) {
  if (!credentialId) {
    throw new Error("Unauthorized.");
  }

  const organizer = await organizerRepo.findOrganizerByCredentialId(credentialId);

  if (!organizer) {
    throw new Error("Organizer not found.");
  }

  const {
    first_name,
    middle_name,
    last_name,
    company_id,
  } = organizer;

  return {
    first_name,
    middle_name,
    last_name,
    company_id,
  };
}