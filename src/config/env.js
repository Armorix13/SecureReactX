export function getEnv() {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
    encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY ?? "",
    appName: import.meta.env.VITE_APP_NAME ?? "dummy-project",
    appType: import.meta.env.VITE_APP_TYPE ?? "Web",
    defaultRequestKey:
      import.meta.env.VITE_DEFAULT_REQUEST_KEY ?? "APP_VERSION_ANDROID",
  };
}
