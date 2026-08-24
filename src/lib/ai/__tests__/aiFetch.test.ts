jest.mock('@/state/providerStore', () => ({
  checkActiveProviderRateLimit: jest.fn(),
  getActiveProviderAdvancedSettings: jest.fn(),
  getActiveProviderKey: jest.fn(),
  getActiveProviderModel: jest.fn(),
  getActiveProviderRouting: jest.fn(),
}));

import { aiFetch, ProviderRateLimitError } from '../aiFetch';
import {
  checkActiveProviderRateLimit,
  getActiveProviderAdvancedSettings,
  getActiveProviderKey,
  getActiveProviderModel,
  getActiveProviderRouting,
} from '@/state/providerStore';

const mockGetKey = getActiveProviderKey as jest.MockedFunction<typeof getActiveProviderKey>;
const mockGetModel = getActiveProviderModel as jest.MockedFunction<typeof getActiveProviderModel>;
const mockGetRouting = getActiveProviderRouting as jest.MockedFunction<
  typeof getActiveProviderRouting
>;
const mockGetAdvanced = getActiveProviderAdvancedSettings as jest.MockedFunction<
  typeof getActiveProviderAdvancedSettings
>;
const mockCheckRateLimit = checkActiveProviderRateLimit as jest.MockedFunction<
  typeof checkActiveProviderRateLimit
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetModel.mockReturnValue(null);
  mockGetRouting.mockReturnValue(null);
  mockGetAdvanced.mockReturnValue(null);
  mockCheckRateLimit.mockReturnValue(true);
  global.fetch = jest.fn(async () => ({ ok: true })) as unknown as typeof fetch;
});

function lastFetchHeaders(): Headers {
  const init = (global.fetch as jest.Mock).mock.calls[0][1];
  return new Headers(init.headers);
}

describe('aiFetch', () => {
  test('attaches the provider key header when a key exists', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    expect(lastFetchHeaders().get('x-provider-api-key')).toBe('byo-key');
  });

  test('sends no key header when none is configured', async () => {
    mockGetKey.mockResolvedValue(null);
    await aiFetch('/api/narrative/generate');

    expect(lastFetchHeaders().has('x-provider-api-key')).toBe(false);
  });

  test('attaches the configured model header', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    mockGetModel.mockReturnValue('gemini-2.5-pro');
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    expect(lastFetchHeaders().get('x-provider-model')).toBe('gemini-2.5-pro');
  });

  test('sends no model header when no model is configured', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    await aiFetch('/api/narrative/generate');

    expect(lastFetchHeaders().has('x-provider-model')).toBe(false);
  });

  test('attaches the provider type and endpoint so a key is not posted to Google', async () => {
    mockGetKey.mockResolvedValue('openrouter-key');
    mockGetRouting.mockReturnValue({
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    });
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    const headers = lastFetchHeaders();
    expect(headers.get('x-provider-type')).toBe('openai-compatible');
    expect(headers.get('x-provider-endpoint')).toBe('https://openrouter.ai/api/v1/chat/completions');
  });

  test('sends no endpoint header for a provider that has no custom endpoint', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    mockGetRouting.mockReturnValue({ type: 'gemini', endpoint: '' });
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    const headers = lastFetchHeaders();
    expect(headers.get('x-provider-type')).toBe('gemini');
    expect(headers.get('x-provider-endpoint')).toBeNull();
  });

  test('preserves caller-supplied headers', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    await aiFetch('/api/x', { headers: { 'Content-Type': 'application/json' } });

    const headers = lastFetchHeaders();
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('x-provider-api-key')).toBe('byo-key');
  });

  test('falls back to a plain fetch when key lookup throws', async () => {
    mockGetKey.mockRejectedValue(new Error('decrypt failed'));
    await aiFetch('/api/x');

    expect(lastFetchHeaders().has('x-provider-api-key')).toBe(false);
  });

  test('attaches a timeout signal by default when the runtime supports it', async () => {
    // jsdom's AbortSignal has no static timeout; emulate the browser/Node API.
    const signal = new AbortController().signal;
    (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout = jest.fn(() => signal);
    try {
      mockGetKey.mockResolvedValue(null);
      await aiFetch('/api/x');

      const init = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(init.signal).toBe(signal);
    } finally {
      delete (AbortSignal as unknown as { timeout?: unknown }).timeout;
    }
  });

  test('preserves a caller-supplied signal', async () => {
    mockGetKey.mockResolvedValue(null);
    const controller = new AbortController();
    await aiFetch('/api/x', { signal: controller.signal });

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.signal).toBe(controller.signal);
  });

  test('composes a caller signal WITH the timeout ceiling instead of replacing it', async () => {
    // Emulate a runtime with AbortSignal.timeout so the ceiling exists.
    const ceiling = new AbortController();
    (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout =
      jest.fn(() => ceiling.signal);
    try {
      mockGetKey.mockResolvedValue(null);
      const caller = new AbortController();
      await aiFetch('/api/x', { signal: caller.signal });

      const init = (global.fetch as jest.Mock).mock.calls[0][1];
      // The composed signal fires when the CALLER aborts (race loss)…
      expect(init.signal.aborted).toBe(false);
      caller.abort();
      expect(init.signal.aborted).toBe(true);
    } finally {
      delete (AbortSignal as unknown as { timeout?: unknown }).timeout;
    }
  });

  test('honors a per-call timeoutMs budget', async () => {
    const timeoutSpy = jest.fn(() => new AbortController().signal);
    (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout = timeoutSpy;
    try {
      mockGetKey.mockResolvedValue(null);
      await aiFetch('/api/narrative/generate', {}, { timeoutMs: 45_000 });

      expect(timeoutSpy).toHaveBeenCalledWith(45_000);
    } finally {
      delete (AbortSignal as unknown as { timeout?: unknown }).timeout;
    }
  });

  test('attaches the advanced-settings overrides that are actually set', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    mockGetAdvanced.mockReturnValue({ temperature: 1.2, topP: 0.5, maxTokens: 4096 });
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    const headers = lastFetchHeaders();
    expect(headers.get('x-provider-temperature')).toBe('1.2');
    expect(headers.get('x-provider-top-p')).toBe('0.5');
    expect(headers.get('x-provider-max-tokens')).toBe('4096');
  });

  test('attaches prompt overrides when they are set', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    mockGetAdvanced.mockReturnValue({
      customSafetyPrompt: ' keep it PG ',
      customSystemPrompt: ' be terse ',
    });
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    const headers = lastFetchHeaders();
    expect(headers.has('x-provider-temperature')).toBe(false);
    expect(headers.has('x-provider-top-p')).toBe(false);
    expect(headers.has('x-provider-max-tokens')).toBe(false);
    expect(headers.get('x-provider-custom-safety-prompt')).toBe('keep it PG');
    expect(headers.get('x-provider-custom-system-prompt')).toBe('be terse');
  });

  test('sends no override headers for settings that were never touched', async () => {
    mockGetKey.mockResolvedValue('byo-key');
    mockGetAdvanced.mockReturnValue({});
    await aiFetch('/api/narrative/generate', { method: 'POST' });

    const headers = lastFetchHeaders();
    expect(headers.has('x-provider-temperature')).toBe(false);
    expect(headers.has('x-provider-top-p')).toBe(false);
    expect(headers.has('x-provider-max-tokens')).toBe(false);
    expect(headers.has('x-provider-custom-safety-prompt')).toBe(false);
    expect(headers.has('x-provider-custom-system-prompt')).toBe(false);
  });

  test('rejects before fetching once the configured request budget is exhausted', async () => {
    mockCheckRateLimit.mockReturnValue(false);

    await expect(aiFetch('/api/narrative/generate')).rejects.toThrow(ProviderRateLimitError);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
