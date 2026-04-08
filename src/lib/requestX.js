/**
 * Mirrors RequestX from Dart: builds JSON payload, encrypts for API, decrypts ResponseX.
 */
import { encrypt } from "./javaStringEncryption.js";
import {
  decryptResponseBodyWithPlain,
  decryptResponseX,
  responseXFromJson,
} from "./responseX.js";

/**
 * @param {{
 *   key: string;
 *   parameters: Record<string, string>;
 *   hash?: string | null;
 *   deviceAppId?: string | null;
 *   json?: string | null;
 *   deviceType?: string | null;
 *   deviceOs?: string | null;
 *   deviceBrand?: string | null;
 *   deviceModel?: string | null;
 *   deviceSdk?: string | null;
 *   deviceIp?: string | null;
 *   appType?: string | null;
 *   appName?: string | null;
 *   appVersion?: string | null;
 *   appAgent?: string | null;
 *   firebaseToken?: string | null;
 *   dateTime?: Date;
 * }} opts
 */
export function buildRequestPayload(opts) {
  const iso = (opts.dateTime ?? new Date()).toISOString();
  return JSON.stringify({
    DateTime: iso,
    Hash: opts.hash ?? null,
    DeviceAppId: opts.deviceAppId ?? null,
    Key: opts.key,
    Parameters: opts.parameters,
    Json: opts.json ?? null,
    DeviceType: opts.deviceType ?? null,
    DeviceOs: opts.deviceOs ?? null,
    DeviceBrand: opts.deviceBrand ?? null,
    DeviceModel: opts.deviceModel ?? null,
    DeviceSdk: opts.deviceSdk ?? null,
    DeviceIp: opts.deviceIp ?? null,
    AppType: opts.appType ?? null,
    AppName: opts.appName ?? null,
    AppVersion: opts.appVersion ?? null,
    AppAgent: opts.appAgent ?? null,
    FirebaseToken: opts.firebaseToken ?? null,
  });
}

function extractMessage(err) {
  const text = String(err);
  const idx = text.indexOf(":");
  return idx !== -1 ? text.slice(idx + 1).trim() : text;
}

const FAIL_TAG = { saveInApp: false, saveInAppExpiry: null, json: null };

/** GET baseUrl?data=<encrypted payload> */
export async function getResponse(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const data = encrypt(buildRequestPayload(requestOpts), encryptionKey);
  const url = `${baseUrl}?data=${encodeURIComponent(data)}`;
  try {
    const res = await fetch(url, { method: "GET", signal: extra.signal });
    const text = await res.text();
    if (!text) throw new Error("No response");
    return decryptResponseX(text, encryptionKey);
  } catch (e) {
    return { success: false, error: extractMessage(e), tag: FAIL_TAG };
  }
}

/** GET with raw/plain/response detail (for logging). */
export async function getResponseWithDetails(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const data = encrypt(buildRequestPayload(requestOpts), encryptionKey);
  const url = `${baseUrl}?data=${encodeURIComponent(data)}`;
  try {
    const res = await fetch(url, { method: "GET", signal: extra.signal });
    const raw = await res.text();
    if (!raw) throw new Error("No response");
    const { plain, response } = decryptResponseBodyWithPlain(raw, encryptionKey);
    return { raw, plain, response };
  } catch (e) {
    return { success: false, error: extractMessage(e), tag: FAIL_TAG };
  }
}

/** POST body = encrypted string */
export async function postResponse(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const data = encrypt(buildRequestPayload(requestOpts), encryptionKey);
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8", Accept: "text/plain, */*" },
      body: data,
      signal: extra.signal,
    });
    const text = await res.text();
    if (!text) throw new Error("No response");
    return decryptResponseX(text, encryptionKey);
  } catch (e) {
    return { success: false, error: extractMessage(e), tag: FAIL_TAG };
  }
}

/** POST with raw/plain/response detail (for logging). */
export async function postResponseWithDetails(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const data = encrypt(buildRequestPayload(requestOpts), encryptionKey);
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8", Accept: "text/plain, */*" },
      body: data,
      signal: extra.signal,
    });
    const raw = await res.text();
    if (!raw) throw new Error("No response");
    const { plain, response } = decryptResponseBodyWithPlain(raw, encryptionKey);
    return { raw, plain, response };
  } catch (e) {
    return { success: false, error: extractMessage(e), tag: FAIL_TAG };
  }
}

export { decryptResponseBodyWithPlain, decryptResponseX, responseXFromJson };
