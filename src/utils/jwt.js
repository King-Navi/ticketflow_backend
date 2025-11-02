import jwt from 'jsonwebtoken';


export function verifyJwtToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Generates a signed JSON Web Token (JWT) for an authenticated user.
 *
 * The token contains key user information and is signed with the server's
 * secret key (`process.env.JWT_SECRET`). The token is valid for 23 hours.
 *
 * @param {number|string} profileId - The unique ID of the user | attendee_id / organizer_id / admin_id.
 * @param {string} email - The user's email address.
 * @param {string} nickname - The user's nickname or alias.
 * @param {string} firstName - The user's first name (or display name).
 * @param {string|string[]} typeUser - The user's role or list of roles (ROLE_CODE).
 * @param {string} expires - time of duration
 * 
 * @returns {string} A signed JWT string containing user information.
 */
export function generateToken(profileId, email, nickname, firstName, roleCode, credentialId) {
  const payload = {
    sub: credentialId,
    id: profileId,
    email,
    nickname,
    username: firstName,
    typeUser: roleCode,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });
}
