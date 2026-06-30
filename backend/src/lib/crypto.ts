import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 16;
const KEY_HEX_LENGTH = 64; // 32 bytes = 64 hex chars

function loadKey(): Buffer {
  const hex = process.env.OTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `OTP_ENCRYPTION_KEY harus berupa hex string 64 karakter (32 byte). ` +
      `Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Enkripsi string dengan AES-256-GCM.
 * Output format: <iv_hex>:<ciphertext_hex>:<authtag_hex>
 */
export function encryptAES(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 byte GCM auth tag

  return [
    iv.toString('hex'),
    ciphertext.toString('hex'),
    authTag.toString('hex'),
  ].join(':');
}

/**
 * Dekripsi output dari encryptAES.
 * Melempar error jika format salah atau auth tag tidak cocok (tamper detected).
 */
export function decryptAES(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Format ciphertext tidak valid — expected iv:ciphertext:authtag');
  }

  const key = loadKey();
  const [ivHex, ciphertextHex, authTagHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
