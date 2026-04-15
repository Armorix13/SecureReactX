/**
 * RequestX — mirrors the Dart RequestX model and HttpHelper.
 *
 * Flow (matches Dart getResponse):
 *   buildPayload(opts) → JSON string
 *   encrypt(json, key) → Base64 ciphertext
 *   GET  baseUrl?data=<encodeURIComponent(ciphertext)>
 *   POST baseUrl  body=ciphertext  Content-Type: text/plain
 *   response body → decryptBody(body, key) → ResponseX
 */
import { encrypt } from "./encryption.js";
import { decryptBody } from "./responseX.js";

// ─── RequestX payload builder ─────────────────────────────────────────────────

/**
 * Build the RequestX JSON string that gets encrypted before sending.
 *
 * @param {{
 *   key: string;
 *   parameters?: Record<string, string>;
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
 * @returns {string} JSON string
 */
export function buildPayload(opts) {
  return JSON.stringify({
    DateTime: (opts.dateTime ?? new Date()).toISOString(),
    Hash: opts.hash ?? null,
    DeviceAppId: opts.deviceAppId ?? null,
    Key: opts.key,
    Parameters: opts.parameters ?? {},
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Wrap a network/crypto error into the standard failure shape.
 * AbortError is re-thrown so callers can distinguish deliberate cancellation
 * from genuine failures.
 *
 * @param {unknown} err
 * @returns {{ success: false; error: string; tag: object }}
 */
function errorShape(err) {
  // Let AbortError propagate — the caller explicitly cancelled the request.
  if (err instanceof Error && err.name === "AbortError") throw err;

  const msg = String(err);
  const idx = msg.indexOf(":");
  return {
    success: false,
    error: idx !== -1 ? msg.slice(idx + 1).trim() : msg,
    tag: { saveInApp: false, saveInAppExpiry: null, json: null },
  };
}

/**
 * Assert the HTTP response status is 2xx.
 * Throws a descriptive Error for 4xx / 5xx responses.
 *
 * @param {Response} res
 */
function assertOk(res) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
}

/**
 * Build and encrypt the GET query string.
 *
 * @param {string} baseUrl
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @returns {string} Full URL with ?data= parameter
 */
function buildGetUrl(baseUrl, encryptionKey, requestOpts) {
  const data = encrypt(buildPayload(requestOpts), encryptionKey);
  return `${baseUrl}?data=${encodeURIComponent(data)}`;
}

/**
 * Shared POST fetch options.
 *
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @param {AbortSignal | undefined} signal
 * @returns {{ init: RequestInit; data: string }}
 */
function buildPostInit(encryptionKey, requestOpts, signal) {
  const data = encrypt(buildPayload(requestOpts), encryptionKey);
  return {
    data,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Accept: "text/plain, */*",
      },
      body: data,
      signal,
    },
  };
}

// ─── Public HTTP helpers ──────────────────────────────────────────────────────

/**
 * GET  baseUrl?data=<encrypted RequestX JSON>
 * Returns a parsed ResponseX.
 *
 * @param {string} baseUrl
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @param {{ signal?: AbortSignal }} [extra]
 * @returns {Promise<import("./responseX.js").ResponseX | { success: false; error: string; tag: object }>}
 */
export async function get(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const url = buildGetUrl(baseUrl, encryptionKey, requestOpts);
  try {
    const res = await fetch(url, { method: "GET", signal: extra.signal });
    assertOk(res);
    const text = await res.text();
    if (!text) throw new Error("Empty response from server.");
    return decryptBody(text, encryptionKey).response;
  } catch (e) {
    return errorShape(e);
  }
}

/**
 * GET — same as get() but also returns raw ciphertext and decrypted plain JSON
 * for logging / debugging.
 *
 * @param {string} baseUrl
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @param {{ signal?: AbortSignal }} [extra]
 * @returns {Promise<{ raw: string; plain: string; response: import("./responseX.js").ResponseX } | { success: false; error: string; tag: object }>}
 */
export async function getWithDetails(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const url = buildGetUrl(baseUrl, encryptionKey, requestOpts);
  try {
    const res = await fetch(url, { method: "GET", signal: extra.signal });
    assertOk(res);
    const raw = await res.text();
    if (!raw) throw new Error("Empty response from server.");
    const { plain, response } = decryptBody(raw, encryptionKey);
    return { raw, plain, response };
  } catch (e) {
    return errorShape(e);
  }
}

/**
 * POST  baseUrl  body=<encrypted RequestX JSON>  Content-Type: text/plain
 * Returns a parsed ResponseX.
 *
 * @param {string} baseUrl
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @param {{ signal?: AbortSignal }} [extra]
 * @returns {Promise<import("./responseX.js").ResponseX | { success: false; error: string; tag: object }>}
 */
export async function post(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const { init } = buildPostInit(encryptionKey, requestOpts, extra.signal);
  try {
    const res = await fetch(baseUrl, init);
    assertOk(res);
    const text = await res.text();
    if (!text) throw new Error("Empty response from server.");
    return decryptBody(text, encryptionKey).response;
  } catch (e) {
    return errorShape(e);
  }
}

/**
 * POST — same as post() but also returns raw ciphertext and decrypted plain JSON.
 *
 * @param {string} baseUrl
 * @param {string} encryptionKey
 * @param {Parameters<typeof buildPayload>[0]} requestOpts
 * @param {{ signal?: AbortSignal }} [extra]
 * @returns {Promise<{ raw: string; plain: string; response: import("./responseX.js").ResponseX } | { success: false; error: string; tag: object }>}
 */
export async function postWithDetails(baseUrl, encryptionKey, requestOpts, extra = {}) {
  const { init } = buildPostInit(encryptionKey, requestOpts, extra.signal);
  try {
    const res = await fetch(baseUrl, init);
    assertOk(res);
    const raw = await res.text();
    if (!raw) throw new Error("Empty response from server.");
    const { plain, response } = decryptBody(raw, encryptionKey);
    return { raw, plain, response };
  } catch (e) {
    return errorShape(e);
  }
}
