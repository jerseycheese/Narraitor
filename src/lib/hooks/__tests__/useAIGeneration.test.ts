import { renderHook, act } from '@testing-library/react';
import { useAIGeneration } from '../useAIGeneration';

describe('useAIGeneration', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('handles successful generation', async () => {
    const mockData = { portrait: { url: 'http://example.com/pic.png' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useAIGeneration<{ prompt: string }, typeof mockData>({
        endpoint: '/api/generate-portrait',
        onSuccess,
      })
    );

    let genResult;
    await act(async () => {
      genResult = await result.current.generate({ prompt: 'test' });
    });

    expect(genResult).toEqual(mockData);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual(mockData);
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('transforms raw server error "Payload too large" into plain language and logs raw error to console', async () => {
    const rawServerError = 'Payload too large';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: async () => ({ error: rawServerError, code: 'PAYLOAD_TOO_LARGE' }),
    });

    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAIGeneration<{ prompt: string }>({
        endpoint: '/api/generate-portrait',
        onError,
      })
    );

    await act(async () => {
      await expect(result.current.generate({ prompt: 'huge' })).rejects.toThrow(
        rawServerError
      );
    });

    // Acceptance Criterion 1: Shows plain language error in app's voice with actionable next step
    expect(result.current.error).toBe(
      "Couldn't generate this content because the input is too large. Try shortening your physical description or prompt and try again."
    );
    expect(onError).toHaveBeenCalledWith(
      "Couldn't generate this content because the input is too large. Try shortening your physical description or prompt and try again."
    );

    // Acceptance Criterion 2: Retains raw error details in console logs for debugging
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[useAIGeneration] Generation error at /api/generate-portrait:',
      expect.objectContaining({ message: rawServerError })
    );
  });

  it('transforms rate limit error into plain language with actionable next step', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: '429 rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }),
    });

    const { result } = renderHook(() =>
      useAIGeneration<{ prompt: string }>({
        endpoint: '/api/generate-portrait',
      })
    );

    await act(async () => {
      await expect(result.current.generate({ prompt: 'test' })).rejects.toThrow();
    });

    expect(result.current.error).toContain('Too many requests');
    expect(result.current.error).toContain('Wait a minute or so before trying again');
  });
});
