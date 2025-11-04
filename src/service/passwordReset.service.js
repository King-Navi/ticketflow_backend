import bcrypt from "bcrypt";
import crypto from "node:crypto";
import CredentialRepository from "../repositories/credential.repository.js";
import PasswordResetTokenRepository from "../repositories/passwordResetToken.repository.js";
import { createPasswordResetToken } from "../utils/resetTokenFactory.js";

const credentialRepo = new CredentialRepository();
const resetTokenRepo = new PasswordResetTokenRepository();

const SALT_ROUND = Number(process.env.SALT_ROUND || 10);
const MIN_RESET_PASSWORD_LENGTH = Number(process.env.MIN_RESET_PASSWORD_LENGTH || 8);

/**
 * - Find credential by email (case-insensitive)
 * - If exists: create token in DB
 * - Return the RAW token so the controller can build the email link
 * - If not exists: return null but do NOT throw -> so controller can answer generic message
 *
 * @param {string} email
 * @param {string|null} ip
 * @param {string|null} userAgent
 * @returns {Promise<{rawToken: string, expiresAt: Date} | null>}
 */
export async function requestPasswordResetService(email, ip = null, userAgent = null) {
  if (!email) {
    throw new Error("email is required.");
  }
  const credential = await credentialRepo.findCredentialByEmail(email);
  if (!credential) {
    return null;
  }
  const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
  await resetTokenRepo.createToken({
    credential_id: credential.credential_id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_ip: ip,
    created_ua: userAgent,
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function validatePasswordResetTokenService(tokenRaw) {
  if (!tokenRaw) {
    throw new Error("token is required.");
  }

  const tokenHash = crypto.createHash("sha256").update(tokenRaw, "utf8").digest("hex");

  const tokenRecord = await resetTokenRepo.findValidByHash(tokenHash);
  if (!tokenRecord) {
    return null;
  }

  return {
    credential_id: tokenRecord.credential_id,
    password_reset_token_id: tokenRecord.password_reset_token_id,
  };
}


export async function performPasswordResetService(tokenRaw, newPassword) {
  if (!tokenRaw) throw new Error("token is required.");
  if (!newPassword) throw new Error("newPassword is required.");
  if (newPassword.length < MIN_RESET_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_RESET_PASSWORD_LENGTH} characters long.`);
  }

  const tokenHash = crypto.createHash("sha256").update(tokenRaw, "utf8").digest("hex");

  const tokenRecord = await resetTokenRepo.findValidByHash(tokenHash);
  if (!tokenRecord) {
    throw new Error("Invalid or expired token.");
  }

  const credentialId = tokenRecord.credential_id;

  const credential = await credentialRepo.findById(credentialId);
  if (!credential) {
    await resetTokenRepo.markUsed(tokenRecord.password_reset_token_id);
    throw new Error("Credential not found.");
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUND);

  await credentialRepo.model.update(
    { password_hash: hashed, updated_at: new Date() },
    { where: { credential_id: credentialId } }
  );

  await resetTokenRepo.markUsed(tokenRecord.password_reset_token_id);

  await resetTokenRepo.revokeActiveForCredential(
    credentialId,
    tokenRecord.password_reset_token_id
  );

  return true;
}


function cryptoHash(raw) {
  return (awaitImportCrypto()).createHash("sha256").update(raw, "utf8").digest("hex");
}


function awaitImportCrypto() {
  return require("node:crypto");
}
