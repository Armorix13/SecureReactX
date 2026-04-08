import { getEnv } from "../config/env.js";
import { buildRequestPayload, getResponse, postResponse } from "./requestX.js";
import { decryptResponseBodyWithPlain, decryptResponseX, responseXFromJson } from "./responseX.js";
import { encrypt, decrypt } from "./javaStringEncryption.js";

export async function apiGet(requestOpts, extra) {
  const { apiBaseUrl, encryptionKey } = getEnv();
  return getResponse(apiBaseUrl, encryptionKey, requestOpts, extra);
}

export async function apiPost(requestOpts, extra) {
  const { apiBaseUrl, encryptionKey } = getEnv();
  return postResponse(apiBaseUrl, encryptionKey, requestOpts, extra);
}

export function defaultRequestOptions(overrides = {}) {
  const env = getEnv();
  return {
    key: env.defaultRequestKey,
    parameters: {},
    appType: env.appType,
    appName: env.appName,
    ...overrides,
  };
}

export {
  buildRequestPayload,
  getResponse,
  postResponse,
  decryptResponseBodyWithPlain,
  decryptResponseX,
  responseXFromJson,
  encrypt,
  decrypt,
};
