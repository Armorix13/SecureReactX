/**
 * ResponseX / ResponseTag — mirrors the Dart model classes.
 *
 * Accepts both PascalCase (server JSON) and camelCase keys for flexibility.
 */
import { decrypt } from "./encryption.js";

// ─── ResponseTag ─────────────────────────────────────────────────────────────

/**
 * @typedef {{ saveInApp: boolean; saveInAppExpiry: Date | null; json: string | null }} ResponseTag
 */

/**
 * @param {Record<string, unknown>} raw
 * @returns {ResponseTag}
 */
export function responseTagFromJson(raw) {
  if (!raw || typeof raw !== "object") {
    return { saveInApp: false, saveInAppExpiry: null, json: null };
  }
  const saveInApp = raw.SaveInApp ?? raw.saveInApp;
  const expiry = raw.SaveInAppExpiry ?? raw.saveInAppExpiry;
  const jsonVal = raw.Json ?? raw.json;
  return {
    saveInApp: typeof saveInApp === "boolean" ? saveInApp : false,
    saveInAppExpiry:
      expiry == null || expiry === "" ? null : new Date(String(expiry)),
    json: jsonVal != null ? String(jsonVal) : null,
  };
}

// ─── ResponseX ───────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   success: boolean | null;
 *   error: string | null;
 *   data: unknown;
 *   dataType: number | null;
 *   dataTypeStr: string;
 *   redirect: number | null;
 *   redirectStr: string;
 *   tag: ResponseTag;
 * }} ResponseX
 */

/**
 * @param {Record<string, unknown>} raw
 * @returns {ResponseX}
 */
export function responseXFromJson(raw) {
  const tagRaw = raw.Tag ?? raw.tag;
  return {
    success:
      raw.Success != null || raw.success != null
        ? Boolean(raw.Success ?? raw.success)
        : null,
    error:
      raw.Error != null || raw.error != null
        ? String(raw.Error ?? raw.error)
        : null,
    data: raw.Data ?? raw.data ?? null,
    dataType:
      raw.DataType != null || raw.dataType != null
        ? Number(raw.DataType ?? raw.dataType)
        : null,
    dataTypeStr:
      raw.DataTypeStr != null || raw.dataTypeStr != null
        ? String(raw.DataTypeStr ?? raw.dataTypeStr)
        : "",
    redirect:
      raw.Redirect != null || raw.redirect != null
        ? Number(raw.Redirect ?? raw.redirect)
        : null,
    redirectStr:
      raw.RedirectStr != null || raw.redirectStr != null
        ? String(raw.RedirectStr ?? raw.redirectStr)
        : "",
    tag:
      tagRaw && typeof tagRaw === "object"
        ? responseTagFromJson(tagRaw)
        : responseTagFromJson({}),
  };
}

// ─── Parsing helpers ─────────────────────────────────────────────────────────

/**
 * Parse JSON from a decrypted string.
 * Handles a rare server quirk where the first two bytes `{"D` are missing.
 *
 * @param {string} plain
 * @returns {Record<string, unknown>}
 */
export function parseResponseJson(plain) {
  const t = plain.trim();
  try {
    return JSON.parse(t);
  } catch {
    if (t.startsWith('ata"')) {
      return JSON.parse(`{"D${t}`);
    }
    throw new Error("Response body is not valid JSON after decryption.");
  }
}

/**
 * Decrypt an API response body and return both the plain JSON string and the
 * parsed ResponseX object.  Handles:
 *   - Encrypted Base64 response   (normal flow)
 *   - Plain-text JSON response     (server-side error short-circuit)
 *
 * @param {string} body            - raw HTTP response text
 * @param {string} encryptionKey
 * @returns {{ plain: string; response: ResponseX }}
 */
export function decryptBody(body, encryptionKey) {
  const text = String(body).replace(/^\uFEFF/, "").trim();

  // Server sometimes returns a plain-text JSON error response (not encrypted).
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (
        parsed &&
        typeof parsed === "object" &&
        ("Success" in parsed || "success" in parsed ||
          "Error" in parsed || "error" in parsed)
      ) {
        return { plain: text, response: responseXFromJson(parsed) };
      }
    } catch { /* fall through to decryption */ }
  }

  const plain = decrypt(text, encryptionKey);
  return { plain, response: responseXFromJson(parseResponseJson(plain)) };
}
