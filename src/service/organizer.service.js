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