import crypto from "node:crypto";

/**
 * Generates a password reset token (raw) and its SHA-256 hash.
 * The raw token is the one you will send by email.
 * The hash is the one you will store in DB.
 *
 * @param {number} ttlMinutes - Time to live in minutes (default from env).
 * @returns {{ rawToken: string, tokenHash: string, expiresAt: Date }}
 */
export function createPasswordResetToken(ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MIN || 60)) {
  const raw = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(raw, "utf8").digest("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  return {
    rawToken: raw,
    tokenHash,
    expiresAt,
  };
}
