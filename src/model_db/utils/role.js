export const ROLE = {
  ATTENDEE: "attendee",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

export const ROLE_CODE = {
  [ROLE.ATTENDEE]: 1,
  [ROLE.ORGANIZER]: 2,
  [ROLE.ADMIN]: 3,
};

/**
 * Determines the role information for a given credential.
 *
 * @param {object} credential - Credential record from the database.
 * @param {string} credential.role - Role name stored in the credential (e.g. "attendee", "organizer").
 * @returns {{ roleName: string, roleCode: number }} Object containing both role name and role code.
 */
export function resolveUserRole(credential) {
  const roleName = credential?.role?.toLowerCase();

  if (!roleName || !Object.values(ROLE).includes(roleName)) {
    throw new Error("Invalid or unsupported role in credential.");
  }

  return {
    roleName,
    roleCode: ROLE_CODE[roleName],
  };
}

export function toRoleCode(value) {
  if (typeof value === "number") return value;
  if (!value) return undefined;
  const name = String(value).toLowerCase();
  return ROLE_CODE[name];
}
