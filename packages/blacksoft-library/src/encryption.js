/**
 * JavaStringEncryption — JavaScript port of the Dart class.
 *
 * Algorithm : AES-128-CBC with PKCS7 padding
 * Key       : first 16 UTF-8 bytes of the passphrase (zero-padded if shorter)
 * IV        : identical to the key (static / deterministic — matches Dart behaviour)
 * Output    : Base64(ciphertext)   — no IV prefix in the wire format
 */
import CryptoJS from "crypto-js";

const TEXT_ENCODER = new TextEncoder();

/**
 * Derive the 16-byte key + IV WordArray from a passphrase string.
 * Mirrors Dart: `List<int>.filled(16, 0)` → `setRange(0, min(len,16), utf8.encode(key))`
 *
 * @param {string} passphrase
 * @returns {CryptoJS.lib.WordArray}
 */
function deriveKeyIv(passphrase) {
  const buf = new Uint8Array(16);
  const bytes = TEXT_ENCODER.encode(passphrase);
  buf.set(bytes.subarray(0, Math.min(bytes.length, 16)));
  return CryptoJS.lib.WordArray.create(buf);
}

/**
 * Encrypt plain text using AES-128-CBC.
 *
 * @param {string} plainText       - UTF-8 text to encrypt
 * @param {string} encryptionKey   - passphrase (first 16 UTF-8 bytes used as key + IV)
 * @returns {string}               - Base64-encoded ciphertext
 */
export function encrypt(plainText, encryptionKey) {
  if (typeof plainText !== "string") {
    throw new TypeError("plainText must be a string.");
  }
  if (!encryptionKey) {
    throw new Error("encryptionKey is required.");
  }
  const keyIv = deriveKeyIv(encryptionKey);
  return CryptoJS.AES.encrypt(plainText, keyIv, {
    iv: keyIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

/**
 * Decrypt a Base64-encoded ciphertext using AES-128-CBC.
 *
 * @param {string} cipherText      - Base64 ciphertext (output of encrypt())
 * @param {string} encryptionKey   - same passphrase used for encryption
 * @returns {string}               - decrypted UTF-8 plain text
 * @throws {Error}                 - if the key is wrong or the ciphertext is corrupted
 */
export function decrypt(cipherText, encryptionKey) {
  if (typeof cipherText !== "string") {
    throw new TypeError("cipherText must be a string.");
  }
  if (!encryptionKey) {
    throw new Error("encryptionKey is required.");
  }
  const keyIv = deriveKeyIv(encryptionKey);
  const decrypted = CryptoJS.AES.decrypt(cipherText.trim(), keyIv, {
    iv: keyIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && cipherText.trim().length > 0) {
    throw new Error(
      "Decryption failed — wrong encryptionKey or corrupted ciphertext."
    );
  }
  return result;
}
