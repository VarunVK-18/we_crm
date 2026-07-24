const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.CRED_ENCRYPT_KEY || '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const KEY = Buffer.from(KEY_HEX, 'hex');
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('[Encryption] Encrypt error:', err.message);
    return text;
  }
}

function decrypt(text) {
  if (!text) return '';
  try {
    if (!text.includes(':')) return text;
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Encryption] Decrypt error:', err.message);
    return text;
  }
}

module.exports = { encrypt, decrypt };
