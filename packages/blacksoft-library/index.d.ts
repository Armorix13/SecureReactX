// Type declarations for @blacksoft/blacksoft-library

export interface ResponseTag {
  saveInApp: boolean;
  saveInAppExpiry: Date | null;
  json: string | null;
}

export interface ResponseX {
  success: boolean | null;
  error: string | null;
  data: unknown;
  dataType: number | null;
  dataTypeStr: string;
  redirect: number | null;
  redirectStr: string;
  tag: ResponseTag;
}

export interface RequestOptions {
  key: string;
  parameters?: Record<string, string>;
  hash?: string | null;
  deviceAppId?: string | null;
  json?: string | null;
  deviceType?: string | null;
  deviceOs?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  deviceSdk?: string | null;
  deviceIp?: string | null;
  appType?: string | null;
  appName?: string | null;
  appVersion?: string | null;
  appAgent?: string | null;
  firebaseToken?: string | null;
  dateTime?: Date;
}

export type PartialRequestOptions = Partial<RequestOptions>;

export interface RequestDetails {
  raw: string;
  plain: string;
  response: ResponseX;
}

export type ApiResult = ResponseX | { success: false; error: string; tag: ResponseTag };
export type ApiDetailsResult = RequestDetails | { success: false; error: string; tag: ResponseTag };

export interface DaycareClientConfig {
  apiBaseUrl: string;
  encryptionKey: string;
  appName?: string;
  appType?: string;
  defaultRequestKey?: string;
}

export interface DaycareClient {
  encrypt(plainText: string): string;
  decrypt(cipherText: string): string;
  get(requestOpts?: PartialRequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiResult>;
  getWithDetails(requestOpts?: PartialRequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiDetailsResult>;
  post(requestOpts?: PartialRequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiResult>;
  postWithDetails(requestOpts?: PartialRequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiDetailsResult>;
  buildEncryptedPayload(requestOpts?: PartialRequestOptions): string;
  config: Readonly<DaycareClientConfig>;
}

// ── Main factory ──────────────────────────────────────────────────────────────
export function createDaycareClient(config: DaycareClientConfig): DaycareClient;

// ── Crypto primitives ─────────────────────────────────────────────────────────
export function encrypt(plainText: string, encryptionKey: string): string;
export function decrypt(cipherText: string, encryptionKey: string): string;

// ── ResponseX helpers ─────────────────────────────────────────────────────────
export function responseTagFromJson(raw: Record<string, unknown>): ResponseTag;
export function responseXFromJson(raw: Record<string, unknown>): ResponseX;
export function parseResponseJson(plain: string): Record<string, unknown>;
export function decryptBody(body: string, encryptionKey: string): { plain: string; response: ResponseX };

// ── Low-level HTTP helpers ────────────────────────────────────────────────────
export function buildPayload(opts: RequestOptions): string;
export function get(baseUrl: string, encryptionKey: string, requestOpts: RequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiResult>;
export function getWithDetails(baseUrl: string, encryptionKey: string, requestOpts: RequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiDetailsResult>;
export function post(baseUrl: string, encryptionKey: string, requestOpts: RequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiResult>;
export function postWithDetails(baseUrl: string, encryptionKey: string, requestOpts: RequestOptions, extra?: { signal?: AbortSignal }): Promise<ApiDetailsResult>;
