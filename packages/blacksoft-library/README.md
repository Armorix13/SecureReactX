# @blacksoft/blacksoft-library

Private npm package — encrypted API client compatible with Dart `JavaStringEncryption`.

- **AES-128-CBC**, PKCS7 padding
- Key & IV = first 16 UTF-8 bytes of the passphrase (zero-padded)
- Wire format: `Base64(ciphertext)` — no IV prefix

---

## Installation

### Local file reference

```json
"dependencies": {
  "@blacksoft/blacksoft-library": "file:../path/to/packages/blacksoft-library"
}
```

```bash
npm install
```

### Future — private npm registry

```bash
npm install @blacksoft/blacksoft-library
```

---

## Quick start

### 1 — Create a client instance

Pass your environment variables as config — **never hardcode keys in source**:

```js
import { createDaycareClient } from "@blacksoft/blacksoft-library";

const client = createDaycareClient({
  apiBaseUrl:        process.env.VITE_API_BASE_URL,        // e.g. "https://your-api.example.com/App/Api/Main"
  encryptionKey:     process.env.VITE_ENCRYPTION_KEY,      // kept in .env, never committed
  appName:           process.env.VITE_APP_NAME,            // optional
  appType:           process.env.VITE_APP_TYPE,            // optional, default "Web"
  defaultRequestKey: process.env.VITE_DEFAULT_REQUEST_KEY, // optional
});
```

### 2 — Call the API

```js
// GET  baseUrl?data=<encrypted RequestX JSON>
const response = await client.get({
  key:        "YOUR_REQUEST_KEY",
  parameters: { userId: "123" },
});

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}

// GET with full logging detail (raw cipher, plain JSON, parsed ResponseX)
const { raw, plain, response } = await client.getWithDetails({ key: "YOUR_KEY" });

// POST
const response = await client.post({ key: "YOUR_KEY", parameters: {} });
const { raw, plain, response } = await client.postWithDetails({ key: "YOUR_KEY" });
```

### 3 — Raw encryption / decryption (no HTTP)

```js
const cipher = client.encrypt("hello world");
const plain  = client.decrypt(cipher);
// plain === "hello world"
```

---

## Environment variables

| Variable                    | Required | Description                                        |
|-----------------------------|----------|----------------------------------------------------|
| `VITE_API_BASE_URL`         | ✅       | Full API endpoint URL                              |
| `VITE_ENCRYPTION_KEY`       | ✅       | Passphrase — first 16 UTF-8 bytes used as key + IV |
| `VITE_APP_NAME`             | ➖       | App name sent in RequestX                          |
| `VITE_APP_TYPE`             | ➖       | App type (default: `"Web"`)                        |
| `VITE_DEFAULT_REQUEST_KEY`  | ➖       | Default RequestX key                               |

---

## API reference

### `createDaycareClient(config)` → client

| Method                                  | Returns                            | Description                   |
|-----------------------------------------|------------------------------------|-------------------------------|
| `client.get(opts?, extra?)`             | `Promise<ResponseX>`               | GET API call                  |
| `client.getWithDetails(opts?, extra?)`  | `Promise<{raw, plain, response}>`  | GET with logging detail        |
| `client.post(opts?, extra?)`            | `Promise<ResponseX>`               | POST API call                 |
| `client.postWithDetails(opts?, extra?)` | `Promise<{raw, plain, response}>`  | POST with logging detail       |
| `client.encrypt(text)`                  | `string`                           | AES-128-CBC encrypt → Base64  |
| `client.decrypt(cipher)`                | `string`                           | AES-128-CBC decrypt → plain   |
| `client.buildEncryptedPayload(opts?)`   | `string`                           | Build + encrypt RequestX JSON |
| `client.config`                         | `Readonly<DaycareClientConfig>`    | Current config snapshot       |

### `ResponseX` shape

```ts
{
  success:     boolean | null
  error:       string  | null
  data:        unknown
  dataType:    number  | null
  dataTypeStr: string
  redirect:    number  | null
  redirectStr: string
  tag: {
    saveInApp:       boolean
    saveInAppExpiry: Date | null
    json:            string | null
  }
}
```

### Named exports (low-level)

```js
import { encrypt, decrypt }                        from "@blacksoft/blacksoft-library";
import { responseXFromJson, decryptBody }           from "@blacksoft/blacksoft-library";
import { buildPayload, get, getWithDetails, post }  from "@blacksoft/blacksoft-library";
```
