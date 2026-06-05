/**
 * Encryption round-trip tests.
 *
 * The jsdom jest env only shims crypto.randomUUID, so we inject Node's WebCrypto
 * for crypto.subtle, and mock masterKeyStore with an in-memory key so we don't
 * need IndexedDB here.
 */
import { webcrypto } from 'crypto';

jest.mock('../masterKeyStore', () => {
  let stored: CryptoKey | null = null;
  return {
    loadMasterKey: jest.fn(async () => stored),
    saveMasterKey: jest.fn(async (key: CryptoKey) => {
      stored = key;
    }),
    clearMasterKey: jest.fn(async () => {
      stored = null;
    }),
  };
});

import { clearEncryptionKey, decryptSecret, encryptSecret } from '../encryption';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
});

beforeEach(async () => {
  // Reset the cached master key (and the mocked store) between tests.
  await clearEncryptionKey();
});

describe('encryption', () => {
  test('round-trips a secret through encrypt and decrypt', async () => {
    const secret = 'AIzaSy-not-a-real-key-123';
    const payload = await encryptSecret(secret);

    expect(payload.ciphertext).toBeTruthy();
    expect(payload.iv).toBeTruthy();
    expect(payload.ciphertext).not.toContain(secret);

    const decrypted = await decryptSecret(payload);
    expect(decrypted).toBe(secret);
  });

  test('uses a fresh IV per encryption', async () => {
    const a = await encryptSecret('same-secret');
    const b = await encryptSecret('same-secret');

    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  test('rejects tampered ciphertext', async () => {
    const payload = await encryptSecret('tamper-me');
    const tampered = {
      ...payload,
      // Flip the first base64 char to corrupt the ciphertext / auth tag.
      ciphertext: (payload.ciphertext[0] === 'A' ? 'B' : 'A') + payload.ciphertext.slice(1),
    };

    await expect(decryptSecret(tampered)).rejects.toThrow();
  });

  test('cannot decrypt after the key is forgotten', async () => {
    const payload = await encryptSecret('forget-me');
    await clearEncryptionKey(); // new master key generated on next use

    await expect(decryptSecret(payload)).rejects.toThrow();
  });
});
