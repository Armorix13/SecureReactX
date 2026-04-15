/**
 * createDaycareClient — factory that returns a fully configured API client.
 *
 * Usage:
 *   const client = createDaycareClient({
 *     apiBaseUrl:        "https://your-api.example.com/App/Api/Main",
 *     encryptionKey:     process.env.ENCRYPTION_KEY,
 *     // optional ↓
 *     appName:           "my-app",
 *     appType:           "Web",
 *     defaultRequestKey: "YOUR_REQUEST_KEY",
 *   });
 *
 *   const response = await client.get({ key: "YOUR_KEY", parameters: {} });
 *   const details  = await client.getWithDetails({ key: "YOUR_KEY", parameters: {} });
 *
 *   // Raw crypto (no HTTP):
 *   const cipher = client.encrypt("hello");
 *   const plain  = client.decrypt(cipher);
 */
import { encrypt, decrypt } from "./encryption.js";
import {
  buildPayload,
  get     as httpGet,
  getWithDetails as httpGetWithDetails,
  post    as httpPost,
  postWithDetails as httpPostWithDetails,
} from "./requestX.js";

/**
 * @typedef {{
 *   apiBaseUrl:         string;
 *   encryptionKey:      string;
 *   appName?:           string;
 *   appType?:           string;
 *   defaultRequestKey?: string;
 * }} DaycareClientConfig
 */

/**
 * Build default RequestX options from the client config.
 *
 * @param {DaycareClientConfig} config
 * @param {Partial<Parameters<typeof buildPayload>[0]>} [overrides]
 * @returns {Parameters<typeof buildPayload>[0]}
 */
function defaultOpts(config, overrides = {}) {
  return {
    key: config.defaultRequestKey ?? "APP_VERSION_ANDROID",
    parameters: {},
    appName: config.appName ?? null,
    appType: config.appType ?? "Web",
    ...overrides,
  };
}

/**
 * Create a configured DaycareIT API client.
 *
 * @param {DaycareClientConfig} config
 */
export function createDaycareClient(config) {
  const { apiBaseUrl, encryptionKey } = config;

  if (!apiBaseUrl) throw new Error("[blacksoft-library] apiBaseUrl is required.");
  if (!encryptionKey) throw new Error("[blacksoft-library] encryptionKey is required.");

  return {
    // ── Crypto ───────────────────────────────────────────────────────────────

    /** @param {string} plainText @returns {string} Base64 ciphertext */
    encrypt: (plainText) => encrypt(plainText, encryptionKey),

    /** @param {string} cipherText @returns {string} plain text */
    decrypt: (cipherText) => decrypt(cipherText, encryptionKey),

    // ── HTTP — GET ────────────────────────────────────────────────────────────

    /**
     * GET baseUrl?data=<encrypted RequestX JSON> → ResponseX
     *
     * @param {Partial<Parameters<typeof buildPayload>[0]>} [requestOpts]
     * @param {{ signal?: AbortSignal }} [extra]
     */
    get: (requestOpts = {}, extra = {}) =>
      httpGet(apiBaseUrl, encryptionKey, defaultOpts(config, requestOpts), extra),

    /**
     * GET — same as get() but returns { raw, plain, response } for logging.
     *
     * @param {Partial<Parameters<typeof buildPayload>[0]>} [requestOpts]
     * @param {{ signal?: AbortSignal }} [extra]
     */
    getWithDetails: (requestOpts = {}, extra = {}) =>
      httpGetWithDetails(apiBaseUrl, encryptionKey, defaultOpts(config, requestOpts), extra),

    // ── HTTP — POST ───────────────────────────────────────────────────────────

    /**
     * POST baseUrl body=<encrypted RequestX JSON> → ResponseX
     *
     * @param {Partial<Parameters<typeof buildPayload>[0]>} [requestOpts]
     * @param {{ signal?: AbortSignal }} [extra]
     */
    post: (requestOpts = {}, extra = {}) =>
      httpPost(apiBaseUrl, encryptionKey, defaultOpts(config, requestOpts), extra),

    /**
     * POST — same as post() but returns { raw, plain, response } for logging.
     *
     * @param {Partial<Parameters<typeof buildPayload>[0]>} [requestOpts]
     * @param {{ signal?: AbortSignal }} [extra]
     */
    postWithDetails: (requestOpts = {}, extra = {}) =>
      httpPostWithDetails(apiBaseUrl, encryptionKey, defaultOpts(config, requestOpts), extra),

    // ── Low-level — direct access ─────────────────────────────────────────────

    /** Build encrypted request payload string (the value for ?data=) */
    buildEncryptedPayload: (requestOpts = {}) =>
      encrypt(buildPayload(defaultOpts(config, requestOpts)), encryptionKey),

    /** Current config snapshot (read-only copy) */
    config: Object.freeze({ ...config }),
  };
}
