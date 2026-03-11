import crypto from 'node:crypto';

const ENCRYPTED_PREFIX = '[encrypt]';
const KEY_ENV_NAME = 'PASSWORD_ENCRYPTION_KEY';
const KEY_SALT = '50386-41901-49850-09910-19309';

function getEncryptionKey(): Buffer {
  const rawSecret = process.env[KEY_ENV_NAME] || 'sql-compare-default-key';
  return crypto.scryptSync(rawSecret, KEY_SALT, 32);
}

export function isEncryptedPassword(value?: string): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptPassword(value: string): string {
  if (!value) {
    return value;
  }
  if (isEncryptedPassword(value)) {
    return value;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  return `${ENCRYPTED_PREFIX}${payload}`;
}

export function decryptPassword(value: string): string {
  if (!value || !isEncryptedPassword(value)) {
    return value;
  }

  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const [ivBase64, tagBase64, encryptedBase64] = payload.split('.');

  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.warn('[passwordCrypto] Failed to decrypt password:', error);
    return '';
  }
}
