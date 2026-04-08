import { useCallback, useState } from "react";
import { encrypt, decrypt } from "./lib/javaStringEncryption.js";
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
    </div>
  );
}
