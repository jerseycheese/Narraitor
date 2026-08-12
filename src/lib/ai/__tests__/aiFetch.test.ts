jest.mock('@/state/providerStore', () => ({
  getActiveProviderKey: jest.fn(),
  getActiveProviderModel: jest.fn(),
}));

import { aiFetch } from '../aiFetch';
import { getActiveProviderKey, getActiveProviderModel } from '@/state/providerStore';

const mockGetKey = getActiveProviderKey as jest.MockedFunction<typeof getActiveProviderKey>;
const mockGetModel = getActiveProviderModel as jest.MockedFunction<typeof getActiveProviderModel>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetModel.mockReturnValue(null);
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
});
