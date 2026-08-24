/**
 * providerStore tests. Encryption is mocked (no crypto/IndexedDB needed) with a
 * reversible stand-in so we can prove keys are encrypted on the way in and
 * decrypted just-in-time on the way out — and never stored in plaintext.
 */

jest.mock('@/lib/storage/encryption', () => ({
  encryptSecret: jest.fn(async (plaintext: string) => ({
    ciphertext: `ct:${plaintext}`,
    iv: 'iv',
  })),
  decryptSecret: jest.fn(async (payload: { ciphertext: string }) =>
    payload.ciphertext.replace(/^ct:/, '')
  ),
  clearEncryptionKey: jest.fn(async () => {}),
}));

import {
  useProviderStore,
  checkActiveProviderRateLimit,
  getActiveProviderAdvancedSettings,
  getActiveProviderKey,
  getActiveProviderModel,
  type AddProviderInput,
} from '../providerStore';
import { clearEncryptionKey } from '@/lib/storage/encryption';

function makeInput(overrides: Partial<AddProviderInput> = {}): AddProviderInput {
  return {
    type: 'gemini',
    name: 'My Gemini key',
    endpoint: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
    apiKey: 'AIza-secret',
    capabilities: { text: true, images: true, streaming: true },
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useProviderStore.getState().reset();
  jest.clearAllMocks();
});

describe('providerStore', () => {
  test('addProvider encrypts the key, stores no plaintext, and activates the first', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());

    const config = useProviderStore.getState().providers[id];
    expect(config).toBeDefined();
    expect(config.encryptedApiKey).toBeTruthy();
    // The store keeps the key only under encryptedApiKey — the raw plaintext
    // field is never carried onto the persisted config. (Real ciphertext opacity
    // is covered in encryption.test.ts; the mock here is reversible by design.)
    expect((config as unknown as Record<string, unknown>).apiKey).toBeUndefined();
    expect(config.encryptedApiKey).not.toBe('AIza-secret');
    expect(useProviderStore.getState().activeProviderId).toBe(id);
  });

  test('getActiveProviderKey decrypts the active provider just-in-time', async () => {
    await useProviderStore.getState().addProvider(makeInput({ apiKey: 'AIza-active' }));
    expect(await getActiveProviderKey()).toBe('AIza-active');
  });

  test('getActiveProviderKey returns null with no active provider', async () => {
    expect(await getActiveProviderKey()).toBeNull();
  });

  test('getActiveProviderModel returns the model the player picked', async () => {
    await useProviderStore.getState().addProvider(makeInput({ model: 'gemini-2.5-pro' }));
    expect(getActiveProviderModel()).toBe('gemini-2.5-pro');
  });

  test('getActiveProviderModel returns null with no active provider', () => {
    expect(getActiveProviderModel()).toBeNull();
  });

  test('getActiveProviderAdvancedSettings returns what was saved on the active provider', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());
    await useProviderStore.getState().updateProvider(id, {
      advancedSettings: { temperature: 1.1, rateLimitEnabled: false },
    });

    expect(getActiveProviderAdvancedSettings()).toEqual({
      temperature: 1.1,
      rateLimitEnabled: false,
    });
  });

  test('getActiveProviderAdvancedSettings returns null when nothing was ever set', async () => {
    await useProviderStore.getState().addProvider(makeInput());
    expect(getActiveProviderAdvancedSettings()).toBeNull();
  });

  test('updateAdvancedSettings persists without touching an existing validation result', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());
    useProviderStore.setState({
      validationStatus: { [id]: { valid: true, lastChecked: 1 } },
    });

    useProviderStore.getState().updateAdvancedSettings(id, { temperature: 0.3 });

    expect(useProviderStore.getState().providers[id].advancedSettings).toEqual({
      temperature: 0.3,
    });
    expect(useProviderStore.getState().validationStatus[id]).toEqual({
      valid: true,
      lastChecked: 1,
    });
  });

  test('updateAdvancedSettings(undefined) clears back to defaults, for the Reset button', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());
    useProviderStore.getState().updateAdvancedSettings(id, { temperature: 1.9 });

    useProviderStore.getState().updateAdvancedSettings(id, undefined);

    expect(useProviderStore.getState().providers[id].advancedSettings).toBeUndefined();
  });

  describe('checkActiveProviderRateLimit', () => {
    test('allows requests when no provider is active', () => {
      expect(checkActiveProviderRateLimit()).toBe(true);
    });

    test('allows requests when rate limiting was never turned on', async () => {
      await useProviderStore.getState().addProvider(makeInput());
      expect(checkActiveProviderRateLimit()).toBe(true);
    });

    test('allows requests up to the configured budget, then blocks the next one', async () => {
      const id = await useProviderStore.getState().addProvider(makeInput());
      await useProviderStore.getState().updateProvider(id, {
        advancedSettings: { rateLimitEnabled: true, maxRequestsPerHour: 2 },
      });

      expect(checkActiveProviderRateLimit()).toBe(true);
      expect(checkActiveProviderRateLimit()).toBe(true);
      expect(checkActiveProviderRateLimit()).toBe(false);
    });
  });

  test('removeProvider clears the master key once the last provider is gone', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());

    await useProviderStore.getState().removeProvider(id);

    expect(useProviderStore.getState().providers[id]).toBeUndefined();
    expect(useProviderStore.getState().activeProviderId).toBeNull();
    expect(clearEncryptionKey).toHaveBeenCalledTimes(1);
  });

  test('forgetAllProviders wipes state and the encryption key', async () => {
    await useProviderStore.getState().addProvider(makeInput());
    await useProviderStore.getState().addProvider(makeInput({ name: 'Second' }));

    await useProviderStore.getState().forgetAllProviders();

    expect(Object.keys(useProviderStore.getState().providers)).toHaveLength(0);
    expect(useProviderStore.getState().activeProviderId).toBeNull();
    expect(clearEncryptionKey).toHaveBeenCalled();
  });

  test('validateProvider posts the key as a header and records the result', async () => {
    const fetchMock = jest.fn(async () => ({
      json: async () => ({ valid: true, capabilities: { text: true, images: true } }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const id = await useProviderStore.getState().addProvider(makeInput({ apiKey: 'AIza-validate' }));
    const valid = await useProviderStore.getState().validateProvider(id);

    expect(valid).toBe(true);
    const [, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(init.headers['x-provider-api-key']).toBe('AIza-validate');
    // The body carries config metadata but never the key.
    expect(init.body).not.toContain('AIza-validate');
    expect(useProviderStore.getState().validationStatus[id].valid).toBe(true);
  });

  test('updateProvider re-encrypts a new key and invalidates prior validation', async () => {
    const id = await useProviderStore.getState().addProvider(makeInput());
    useProviderStore.setState((state) => ({
      validationStatus: { ...state.validationStatus, [id]: { valid: true, lastChecked: 1 } },
    }));

    await useProviderStore.getState().updateProvider(id, { apiKey: 'AIza-rotated' });

    expect(useProviderStore.getState().validationStatus[id]).toBeUndefined();
    expect(await getActiveProviderKey()).toBe('AIza-rotated');
  });
});
