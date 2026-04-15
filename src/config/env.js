import { createDaycareClient } from "../lib/index.js";

export function getEnv() {
  return {
    apiBaseUrl:        import.meta.env.VITE_API_BASE_URL        ?? "",
    encryptionKey:     import.meta.env.VITE_ENCRYPTION_KEY      ?? "",
    appName:           import.meta.env.VITE_APP_NAME            ?? "DayCareIt",
    appType:           import.meta.env.VITE_APP_TYPE            ?? "Web",
    defaultRequestKey: import.meta.env.VITE_DEFAULT_REQUEST_KEY ?? "APP_VERSION_ANDROID",
  };
}

/**
 * Ready-to-use API client built from Vite env vars.
 * Pass overrides to replace individual values (e.g. a custom encryptionKey).
 * @param {Partial<ReturnType<typeof getEnv>>} [overrides]
 */
export function getClient(overrides = {}) {
  return createDaycareClient({ ...getEnv(), ...overrides });
}
