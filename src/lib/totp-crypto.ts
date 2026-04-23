import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

function getKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be 32 bytes (64 hex chars). Generate: openssl rand -hex 32");
  }
  return Buffer.from(hex, "hex");
}

// AES-256-GCM: iv(12) + authTag(16) + ciphertext, stored as base64
export function encryptTotpSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptTotpSecret(ciphertext: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// 10 single-use backup codes, format: XXXXXX-XXXXXX (6+6 uppercase hex)
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const a = randomBytes(3).toString("hex").toUpperCase();
    const b = randomBytes(3).toString("hex").toUpperCase();
    return `${a}-${b}`;
  });
}

// HMAC-SHA256 with TOTP_ENCRYPTION_KEY — fast enough for random high-entropy codes
export function hashRecoveryCode(code: string): string {
  const normalized = code.toUpperCase().replace(/-/g, "");
  return createHmac("sha256", getKey()).update(normalized).digest("hex");
}
