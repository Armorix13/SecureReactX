/**
 * Mirrors ResponseX / ResponseTag from Dart.
 */
import { decrypt } from "./javaStringEncryption.js";

/** @param {Record<string, unknown>} json */
export function responseTagFromJson(json) {
  if (!json || typeof json !== "object") {
    return { saveInApp: false, saveInAppExpiry: null, json: null };
  }
  const saveInApp = json.SaveInApp ?? json.saveInApp;
  const rawExpiry = json.SaveInAppExpiry ?? json.saveInAppExpiry;
  return {
    saveInApp: typeof saveInApp === "boolean" ? saveInApp : false,
    saveInAppExpiry:
      rawExpiry == null || rawExpiry === "" ? null : new Date(String(rawExpiry)),
    json:
      json.Json != null
        ? String(json.Json)
        : json.json != null
          ? String(json.json)
          : null,
  };
}

/** @param {Record<string, unknown>} json */
export function responseXFromJson(json) {
  const tagJson = json.Tag ?? json.tag;
  return {
    data: json.Data ?? json.data,
    dataType:
      json.DataType != null || json.dataType != null
        ? Number(json.DataType ?? json.dataType)
        : null,
    dataTypeStr:
      json.DataTypeStr != null || json.dataTypeStr != null
        ? String(json.DataTypeStr ?? json.dataTypeStr)
        : "",
    tag:
      tagJson && typeof tagJson === "object"
        ? responseTagFromJson(tagJson)
        : responseTagFromJson({}),
    redirect:
      json.Redirect != null || json.redirect != null
        ? Number(json.Redirect ?? json.redirect)
        : null,
    redirectStr:
      json.RedirectStr != null || json.redirectStr != null
        ? String(json.RedirectStr ?? json.redirectStr)
        : "",
    error:
      json.Error != null || json.error != null
        ? String(json.Error ?? json.error)
        : null,
    success:
      json.Success != null || json.success != null
        ? Boolean(json.Success ?? json.success)
        : null,
  };
}

export function parseResponseJson(plain) {
  const t = plain.trim();
  try {
    return JSON.parse(t);
  } catch {
    if (t.startsWith('ata"')) {
      return JSON.parse(`{"D${t}`);
    }
    throw new Error("Response is not valid JSON after decryption.");
  }
}

/**
 * Decrypt API body → { plain, response }.
 * Handles both encrypted Base64 and plaintext JSON responses.
 */
export function decryptResponseBodyWithPlain(encryptedBody, encryptionKey) {
  const body = String(encryptedBody).replace(/^\uFEFF/, "").trim();
  if (body.startsWith("{")) {
    try {
      const j = JSON.parse(body);
      if (j && typeof j === "object" && ("Success" in j || "success" in j || "Error" in j || "error" in j)) {
        return { plain: body, response: responseXFromJson(j) };
      }
    } catch { /* not JSON, continue to decrypt */ }
  }
  const plain = decrypt(body, encryptionKey);
  const parsed = parseResponseJson(plain);
  return { plain, response: responseXFromJson(parsed) };
}

/** @param {string} encryptedBody @param {string} encryptionKey */
export function decryptResponseX(encryptedBody, encryptionKey) {
  return decryptResponseBodyWithPlain(encryptedBody, encryptionKey).response;
}
