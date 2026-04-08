/**
 * Exact port of Dart JavaStringEncryption class.
 *
 * - AES-128-CBC, PKCS7 padding
 * - Key = first 16 UTF-8 bytes of passphrase (zero-padded if shorter)
 * - IV  = same first 16 bytes (static, deterministic)
 * - Encrypt output: Base64(ciphertext) — no IV prefix
 * - Decrypt input:  Base64(ciphertext) — no IV to strip
 */
import CryptoJS from "crypto-js";

const DEFAULT_KEY = "Black+Db+256+Bit+Encryption+Key+";

/**
 * Derive the 16-byte key/IV from a passphrase.
 * Matches Dart: `List<int>.filled(16, 0)` → `setRange(0, min(len, 16), utf8.encode(key))`.
 */
function deriveKeyIv(encryptionKey) {
  const buf = new Uint8Array(16);
  const encoded = new TextEncoder().encode(encryptionKey);
  buf.set(encoded.subarray(0, Math.min(encoded.length, 16)));
  return CryptoJS.lib.WordArray.create(buf);
}

/** @param {string} plainText @param {string} [encryptionKey] @returns {string} Base64 ciphertext */
export function encrypt(plainText, encryptionKey = DEFAULT_KEY) {
  const keyIv = deriveKeyIv(encryptionKey);
  const encrypted = CryptoJS.AES.encrypt(plainText, keyIv, {
    iv: keyIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/** @param {string} encryptedStr Base64 ciphertext @param {string} [encryptionKey] @returns {string} plaintext */
export function decrypt(encryptedStr, encryptionKey = DEFAULT_KEY) {
  const keyIv = deriveKeyIv(encryptionKey);
  const decrypted = CryptoJS.AES.decrypt(encryptedStr, keyIv, {
    iv: keyIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && encryptedStr.trim().length > 0) {
    throw new Error("Decryption failed — wrong key or corrupted data.");
  }
  return result;
}
