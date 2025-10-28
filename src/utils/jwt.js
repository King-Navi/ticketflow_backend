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
 * @param {number|string} idUser - The unique ID of the user.
 * @param {string} email - The user's email address.
 * @param {string} nickname - The user's nickname or alias.
 * @param {string} firstName - The user's first name (or display name).
 * @param {string|string[]} typeUser - The user's role or list of roles.
 * @param {string} expires - time of duration
 * 
 * @returns {string} A signed JWT string containing user information.
 */
export function generateToken(idUser, email, nickname, firstName, typeUser, expires="23h" ) {
  return jwt.sign(
    {
      id: idUser,
      email: email,
      nickname: nickname,
      username: firstName,
      typeUser: typeUser,
    },
    process.env.JWT_SECRET,
    { expiresIn: expires }
  );
}
