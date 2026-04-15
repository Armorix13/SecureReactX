import { useCallback, useState } from "react";
import { encrypt, decrypt } from "./lib/javaStringEncryption.js";
import { getResponseWithDetails } from "./lib/requestX.js";
import { defaultRequestOptions } from "./lib/daycareApi.js";
import { getEnv } from "./config/env.js";
import "./App.css";

const DEFAULT_KEY = "DaycareIT+256Bit+Encryption+Key+";

function tryEncrypt(text, key) {
  try {
    return { ok: true, value: encrypt(text, key) };
  } catch (e) {
    return { ok: false, value: e instanceof Error ? e.message : String(e) };
  }
}

function tryDecrypt(cipher, key) {
  try {
    return { ok: true, value: decrypt(cipher, key) };
  } catch (e) {
    return { ok: false, value: e instanceof Error ? e.message : String(e) };
  }
}

export default function App() {
  const env = getEnv();
  const initialKey = env.encryptionKey || DEFAULT_KEY;

  const [key, setKey] = useState(initialKey);

  const [plainInput, setPlainInput] = useState("ROHIT");
  const [encryptResult, setEncryptResult] = useState(() =>
    tryEncrypt("ROHIT", initialKey),
  );

  const [cipherInput, setCipherInput] = useState("+ZFwM0K9S3m7DAtqeXK3PQ==");
  const [decryptResult, setDecryptResult] = useState(() =>
    tryDecrypt("+ZFwM0K9S3m7DAtqeXK3PQ==", initialKey),
  );

  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  const handleEncrypt = useCallback(() => {
    if (!plainInput.trim()) {
      setEncryptResult({ ok: false, value: "Enter text to encrypt." });
      return;
    }
    setEncryptResult(tryEncrypt(plainInput, key));
  }, [plainInput, key]);

  const handleDecrypt = useCallback(() => {
    if (!cipherInput.trim()) {
      setDecryptResult({ ok: false, value: "Enter ciphertext to decrypt." });
      return;
    }
    setDecryptResult(tryDecrypt(cipherInput.trim(), key));
  }, [cipherInput, key]);

  const handleApiCall = useCallback(async () => {
    setApiLoading(true);
    setApiResult(null);
    try {
      const baseUrl = env.apiBaseUrl;
      console.log("baseUrl", baseUrl);
      if (!baseUrl) {
        setApiResult({
          ok: false,
          url: "",
          encrypted: "",
          raw: "",
          plain: "",
          value: "Set VITE_API_BASE_URL in .env",
        });
        return;
      }

      const requestOpts = defaultRequestOptions({ parameters: {} });
      console.log("requestOpts", requestOpts);
      const payload = JSON.stringify({
        DateTime: new Date().toISOString(),
        Hash: null,
        DeviceAppId: null,
        Key: requestOpts.key,
        Parameters: requestOpts.parameters,
        Json: null,
        DeviceType: null,
        DeviceOs: null,
        DeviceBrand: null,
        DeviceModel: null,
        DeviceSdk: null,
        DeviceIp: null,
        AppType: requestOpts.appType ?? null,
        AppName: requestOpts.appName ?? null,
        AppVersion: null,
        AppAgent: null,
        FirebaseToken: null,
      });
      console.log("payload", payload);
      

      const encryptedData = encrypt(payload, key);
      const url = `${baseUrl}?data=${encodeURIComponent(encryptedData)}`;
      console.log("url", url);
      console.log("encryptedData", encryptedData);
      console.log("key", key);
      console.log("requestOpts", requestOpts);

      const result = await getResponseWithDetails(baseUrl, key, requestOpts);
      console.log("result", result);

      if ("raw" in result) {
        setApiResult({
          ok: true,
          url,
          encrypted: encryptedData,
          raw: result.raw,
          plain: result.plain,
          value: JSON.stringify(result.response, null, 2),
        });
      } else {
        setApiResult({
          ok: false,
          url,
          encrypted: encryptedData,
          raw: "",
          plain: "",
          value: JSON.stringify(result, null, 2),
        });
      }
    } catch (e) {
      setApiResult({
        ok: false,
        url: "",
        encrypted: "",
        raw: "",
        plain: "",
        value: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setApiLoading(false);
    }
  }, [env.apiBaseUrl, key]);

  return (
    <div className="app">
      <h1>AES Encryption / Decryption</h1>
      <p className="subtitle">
        AES-128-CBC &middot; PKCS7 &middot; Key &amp; IV = first 16 UTF-8 bytes
        of passphrase
      </p>

      <div className="key-bar">
        <label htmlFor="enc-key">Encryption Key</label>
        <input
          id="enc-key"
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="panels">
        <section className="panel">
          <h2>Encrypt</h2>
          <textarea
            value={plainInput}
            onChange={(e) => setPlainInput(e.target.value)}
            placeholder="Plain text..."
            rows={3}
            spellCheck={false}
          />
          <button type="button" onClick={handleEncrypt}>
            Encrypt
          </button>
          {encryptResult && (
            <div className="result">
              <span className="result-label">
                {encryptResult.ok ? "Encrypted (Base64)" : "Error"}
              </span>
              <pre
                className={`result-value${encryptResult.ok ? "" : " result-error"}`}
              >
                {encryptResult.value}
              </pre>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Decrypt</h2>
          <textarea
            value={cipherInput}
            onChange={(e) => setCipherInput(e.target.value)}
            placeholder="Base64 ciphertext..."
            rows={3}
            spellCheck={false}
          />
          <button type="button" onClick={handleDecrypt}>
            Decrypt
          </button>
          {decryptResult && (
            <div className="result">
              <span className="result-label">
                {decryptResult.ok ? "Decrypted (Plain text)" : "Error"}
              </span>
              <pre
                className={`result-value${decryptResult.ok ? " result-success" : " result-error"}`}
              >
                {decryptResult.value}
              </pre>
            </div>
          )}
        </section>
      </div>

      <section className="api-section">
        <h2>API Call</h2>
        <p className="api-desc">
          Builds <strong>RequestX</strong> JSON &rarr;{" "}
          <code>encrypt(toJson())</code> &rarr;{" "}
          <code>GET baseUrl?data=&#123;encrypted&#125;</code> &rarr; response
          body &rarr; <code>decrypt(response)</code> &rarr;{" "}
          <strong>ResponseX</strong>
        </p>
        <button
          type="button"
          className="api-btn"
          disabled={apiLoading}
          onClick={handleApiCall}
        >
          {apiLoading ? "Calling..." : "Call API"}
        </button>

        {apiResult && (
          <div className="api-results">
            <div className="api-step">
              <span className="result-label">
                1. Encrypted Request (what goes in ?data=)
              </span>
              <pre className="result-value">{apiResult.encrypted || "—"}</pre>
            </div>
            <div className="api-step">
              <span className="result-label">2. Full URL</span>
              <pre className="result-value url-value">
                {apiResult.url || "—"}
              </pre>
            </div>
            <div className="api-step">
              <span className="result-label">
                3. Raw Response (encrypted from server)
              </span>
              <pre className="result-value">{apiResult.raw || "—"}</pre>
            </div>
            <div className="api-step">
              <span className="result-label">
                4. Decrypted Response (plain JSON)
              </span>
              <pre
                className={`result-value${apiResult.plain ? " result-success" : ""}`}
              >
                {apiResult.plain || "—"}
              </pre>
            </div>
            <div className="api-step">
              <span className="result-label">5. Parsed ResponseX</span>
              <pre
                className={`result-value${apiResult.ok ? " result-success" : " result-error"}`}
              >
                {apiResult.value}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
