import { useCallback, useRef, useState } from "react";
import { getEnv, getClient } from "./config/env.js";
import "./App.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildClient(env, encryptionKey) {
  return getClient({ ...env, encryptionKey });
}

function tryCrypto(fn) {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, value: e instanceof Error ? e.message : String(e) };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultBlock({ label, value, variant = "default" }) {
  if (!value) return null;
  const cls =
    variant === "success"
      ? "result-value result-success"
      : variant === "error"
        ? "result-value result-error"
        : "result-value";
  return (
    <div className="result">
      <span className="result-label">{label}</span>
      <pre className={cls}>{value}</pre>
    </div>
  );
}

function ApiStep({ step, label, value, variant }) {
  return (
    <div className="api-step">
      <span className="result-label">
        {step}. {label}
      </span>
      <pre className={`result-value${variant === "success" ? " result-success" : variant === "error" ? " result-error" : ""}`}>
        {value || "—"}
      </pre>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function App() {
  const env        = getEnv();
  const initialKey = env.encryptionKey;

  const [encKey, setEncKey]             = useState(initialKey);
  const [plainInput, setPlainInput]     = useState("");
  const [cipherInput, setCipherInput]   = useState("");
  const [encryptResult, setEncryptResult] = useState(null);
  const [decryptResult, setDecryptResult] = useState(null);
  const [apiLoading, setApiLoading]     = useState(false);
  const [apiResult, setApiResult]       = useState(null);

  const abortRef = useRef(null);

  const client = buildClient(env, encKey);

  // ── Encrypt ─────────────────────────────────────────────────────────────────

  const handleEncrypt = useCallback(() => {
    if (!plainInput.trim()) {
      setEncryptResult({ ok: false, value: "Enter text to encrypt." });
      return;
    }
    setEncryptResult(tryCrypto(() => client.encrypt(plainInput.trim())));
  }, [plainInput, encKey]);

  // ── Decrypt ─────────────────────────────────────────────────────────────────

  const handleDecrypt = useCallback(() => {
    if (!cipherInput.trim()) {
      setDecryptResult({ ok: false, value: "Enter Base64 ciphertext to decrypt." });
      return;
    }
    setDecryptResult(tryCrypto(() => client.decrypt(cipherInput.trim())));
  }, [cipherInput, encKey]);

  // ── API call ─────────────────────────────────────────────────────────────────

  const handleApiCall = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setApiLoading(true);
    setApiResult(null);

    try {
      const requestOpts = {
        key:        env.defaultRequestKey || "APP_VERSION_ANDROID",
        parameters: {},
      };

      const encryptedPayload = client.buildEncryptedPayload(requestOpts);
      const fullUrl = `${client.config.apiBaseUrl}?data=${encodeURIComponent(encryptedPayload)}`;

      const result = await client.getWithDetails(requestOpts, {
        signal: abortRef.current.signal,
      });

      if ("raw" in result) {
        setApiResult({
          ok:        true,
          url:       fullUrl,
          encrypted: encryptedPayload,
          raw:       result.raw,
          plain:     result.plain,
          response:  JSON.stringify(result.response, null, 2),
        });
      } else {
        setApiResult({
          ok:        false,
          url:       fullUrl,
          encrypted: encryptedPayload,
          raw:       "",
          plain:     "",
          response:  JSON.stringify(result, null, 2),
        });
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      setApiResult({
        ok:        false,
        url:       "",
        encrypted: "",
        raw:       "",
        plain:     "",
        response:  e instanceof Error ? e.message : String(e),
      });
    } finally {
      setApiLoading(false);
    }
  }, [encKey, env]);

  const handleCancelApi = useCallback(() => {
    abortRef.current?.abort();
    setApiLoading(false);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app-header">
        <h1>DayCareIt</h1>
        <p className="subtitle">
          AES-128-CBC &middot; PKCS7 &middot; Key &amp; IV = first 16 UTF-8
          bytes &middot; <code>@blacksoft/blacksoft-library</code>
        </p>
      </header>

      {/* ── Encryption Key ── */}
      <div className="key-bar">
        <label htmlFor="enc-key">Encryption Key</label>
        <input
          id="enc-key"
          type="text"
          value={encKey}
          onChange={(e) => setEncKey(e.target.value)}
          placeholder="Passphrase…"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* ── Encrypt / Decrypt panels ── */}
      <div className="panels">
        <section className="panel" aria-labelledby="encrypt-heading">
          <h2 id="encrypt-heading">Encrypt</h2>
          <textarea
            value={plainInput}
            onChange={(e) => setPlainInput(e.target.value)}
            placeholder="Plain text to encrypt…"
            rows={4}
            spellCheck={false}
          />
          <button type="button" onClick={handleEncrypt}>
            Encrypt
          </button>
          <ResultBlock
            label={encryptResult?.ok ? "Encrypted (Base64)" : "Error"}
            value={encryptResult?.value}
            variant={encryptResult?.ok ? "default" : "error"}
          />
        </section>

        <section className="panel" aria-labelledby="decrypt-heading">
          <h2 id="decrypt-heading">Decrypt</h2>
          <textarea
            value={cipherInput}
            onChange={(e) => setCipherInput(e.target.value)}
            placeholder="Base64 ciphertext to decrypt…"
            rows={4}
            spellCheck={false}
          />
          <button type="button" onClick={handleDecrypt}>
            Decrypt
          </button>
          <ResultBlock
            label={decryptResult?.ok ? "Decrypted (Plain text)" : "Error"}
            value={decryptResult?.value}
            variant={decryptResult?.ok ? "success" : "error"}
          />
        </section>
      </div>

      {/* ── API Call ── */}
      <section className="api-section" aria-labelledby="api-heading">
        <h2 id="api-heading">API Call</h2>
        <p className="api-desc">
          Builds <strong>RequestX</strong> JSON &rarr; <code>encrypt()</code>{" "}
          &rarr; <code>GET ?data=…</code> &rarr; <code>decrypt()</code> &rarr;{" "}
          <strong>ResponseX</strong>
        </p>

        <div className="api-actions">
          <button
            type="button"
            className="api-btn"
            disabled={apiLoading}
            onClick={handleApiCall}
          >
            {apiLoading ? "Calling…" : "Call API"}
          </button>
          {apiLoading && (
            <button
              type="button"
              className="api-btn api-btn--cancel"
              onClick={handleCancelApi}
            >
              Cancel
            </button>
          )}
        </div>

        {apiResult && (
          <div className="api-results">
            <ApiStep step={1} label="Encrypted Request (?data=)"    value={apiResult.encrypted} />
            <ApiStep step={2} label="Full URL"                      value={apiResult.url} />
            <ApiStep step={3} label="Raw Response (encrypted)"      value={apiResult.raw} />
            <ApiStep step={4} label="Decrypted Response (plain JSON)" value={apiResult.plain}    variant={apiResult.plain ? "success" : undefined} />
            <ApiStep step={5} label="Parsed ResponseX"              value={apiResult.response}  variant={apiResult.ok ? "success" : "error"} />
          </div>
        )}
      </section>
    </div>
  );
}
