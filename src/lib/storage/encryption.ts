/**
 * Web Crypto wrapper for encrypting provider API keys at rest.
 *
 * Uses AES-GCM with a single non-extractable master key (see masterKeyStore).
 * A fresh 12-byte IV is generated per encryption, so the same key never reuses
 * an IV. Only the API key is encrypted — endpoint URLs and model names stay
 * plain text, which keeps the UI and debugging simple.
 *
 * The plaintext key only exists transiently inside encryptSecret/decryptSecret;
 * callers (the provider factory) decrypt just-in-time and never park the result
 * in long-lived state.
 */

import { clearMasterKey, loadMasterKey, saveMasterKey } from './masterKeyStore';

export interface EncryptedPayload {
  /** Base64-encoded ciphertext (includes the GCM auth tag). */
  ciphertext: string;
  /** Base64-encoded 12-byte initialization vector. */
  iv: string;
}

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment');
  }
  return c;
}

// Cache the master key for the session so we don't round-trip IndexedDB on
// every encrypt/decrypt. Reset by clearEncryptionKey().
let masterKeyPromise: Promise<CryptoKey> | null = null;

async function getMasterKey(): Promise<CryptoKey> {
  if (!masterKeyPromise) {
    masterKeyPromise = (async () => {
      const existing = await loadMasterKey();
      if (existing) return existing;

      const key = await getCrypto().subtle.generateKey(
        { name: ALGORITHM, length: 256 },
        false, // extractable: false — raw key can never be exported, even via XSS
        ['encrypt', 'decrypt']
      );
      await saveMasterKey(key);
      return key;
    })();
  }
  return masterKeyPromise;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt a secret string. Returns the ciphertext + IV to persist.
 */
export async function encryptSecret(plaintext: string): Promise<EncryptedPayload> {
  const cryptoObj = getCrypto();
  const key = await getMasterKey();
  const iv = cryptoObj.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await cryptoObj.subtle.encrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    encoded as BufferSource
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
  };
}

/**
 * Decrypt a payload produced by encryptSecret. Throws if the data was tampered
 * with or the master key no longer matches.
 */
export async function decryptSecret(payload: EncryptedPayload): Promise<string> {
  const cryptoObj = getCrypto();
  const key = await getMasterKey();
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const plaintext = await cryptoObj.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Drop the master key from memory and storage. After this, any previously
 * encrypted payloads become unrecoverable — used by the `forget provider` wipe.
 */
export async function clearEncryptionKey(): Promise<void> {
  masterKeyPromise = null;
  await clearMasterKey();
}
