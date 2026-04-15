/**
 * @blacksoft/blacksoft-library
 *
 * Public API surface — import only what you need:
 *
 *   import { createDaycareClient }              from "@blacksoft/blacksoft-library";
 *   import { encrypt, decrypt }                 from "@blacksoft/blacksoft-library";
 *   import { responseXFromJson, decryptBody }   from "@blacksoft/blacksoft-library";
 *   import { buildPayload, get, post }          from "@blacksoft/blacksoft-library";
 */

// Main factory — preferred entry point
export { createDaycareClient } from "./client.js";

// Crypto primitives
export { encrypt, decrypt } from "./encryption.js";

// ResponseX / ResponseTag parsers
export {
  responseTagFromJson,
  responseXFromJson,
  parseResponseJson,
  decryptBody,
} from "./responseX.js";

// Low-level HTTP helpers (key + baseUrl passed explicitly)
export {
  buildPayload,
  get,
  getWithDetails,
  post,
  postWithDetails,
} from "./requestX.js";
