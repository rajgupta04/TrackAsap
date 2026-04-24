import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getEncryptionKey() {
  const raw = process.env.GITHUB_TOKEN_ENC_KEY || '';
  if (!raw) return null;

  // Prefer 64-char hex key (32 bytes). Also support base64-encoded 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch {
    // ignore parse issues
  }

  throw new Error('Invalid GITHUB_TOKEN_ENC_KEY. Use 64-char hex or base64(32-byte key).');
}

export function isTokenEncryptionConfigured() {
  return Boolean(process.env.GITHUB_TOKEN_ENC_KEY);
}

export function encryptText(plainText) {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error('Token encryption key is not configured');
  }

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptText({ encrypted, iv, tag }) {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error('Token encryption key is not configured');
  }

  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(String(iv), 'base64')
  );
  decipher.setAuthTag(Buffer.from(String(tag), 'base64'));

  const plain = Buffer.concat([
    decipher.update(Buffer.from(String(encrypted), 'base64')),
    decipher.final(),
  ]);

  return plain.toString('utf8');
}
