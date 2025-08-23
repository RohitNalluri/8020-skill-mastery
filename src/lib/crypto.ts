/*
  Purpose: AES-256-GCM helpers to encrypt/decrypt BYOK Gemini key using ENCRYPTION_SECRET.
*/
import crypto from 'crypto';

function getKey(secret: string): Buffer {
  // Derive 32 bytes key from hex/utf8 secret
  let raw: Buffer;
  if (/^[0-9a-fA-F]+$/.test(secret) && secret.length >= 64) {
    raw = Buffer.from(secret, 'hex');
  } else {
    raw = crypto.createHash('sha256').update(secret).digest();
  }
  return raw.subarray(0, 32);
}

export function encrypt(text: string, secret: string): string {
  const key = getKey(secret);
  const iv = crypto.randomBytes(12); // GCM recommended 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Encode as base64(iv|tag|ciphertext)
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decrypt(payload: string, secret: string): string {
  const key = getKey(secret);
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return plaintext;
}
