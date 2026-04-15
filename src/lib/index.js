/**
 * src/lib/index.js — single import point for all crypto + API helpers.
 * Core logic: @blacksoft/blacksoft-library
 * Env wiring:  src/config/env.js
 */

export {
  createDaycareClient,
  encrypt,
  decrypt,
  responseTagFromJson,
  responseXFromJson,
  parseResponseJson,
  decryptBody,
  buildPayload,
  get             as getResponse,
  getWithDetails  as getResponseWithDetails,
  post            as postResponse,
  postWithDetails as postResponseWithDetails,
} from "@blacksoft/blacksoft-library";
