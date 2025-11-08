import { randomBytes, createHash } from "node:crypto";

/**
 * Generates a password reset token (raw) and its SHA-256 hash.
 * The raw token is the one you will send by email.
 * The hash is the one you will store in DB.
 * @param {object} opts
 * @param {number} opts.len - longitud del token (recomendado: 22 para ~128 bits)
 * @param {number} opts.ttlMinutes - minutos de validez
 */
export function createPasswordResetToken({
  len = 22,
  ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MIN ?? 60),
} = {}) {
  let rawToken = "";
  while (rawToken.length < len) {
    // generamos en bloques para no quedarnos cortos y evitar sesgo
    rawToken += randomBytes(32).toString("base64url");
  }
  rawToken = rawToken.slice(0, len);

  return {
    rawToken,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + ttlMinutes * 60000),
  };
}