/**
 * @jest-environment node
 */

jest.mock('@/utils/apiHelpers', () => ({
  makeGeminiRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { makeGeminiRequest } from '@/utils/apiHelpers';

const mockMakeGeminiRequest = makeGeminiRequest as jest.MockedFunction<typeof makeGeminiRequest>;

const URL = 'http://localhost:3000/api/ai/validate-provider';
const KEY = 'AIza-candidate-key';

function buildRequest(opts: { key?: string; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.key) headers['x-provider-api-key'] = opts.key;
  return new NextRequest(URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? { type: 'gemini', model: 'gemini-2.5-flash' }),
  });
}

function fakeResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/ai/validate-provider', () => {
  test('rejects when no key header is present', async () => {
    const response = await POST(buildRequest({ key: undefined }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('NO_KEY');
    expect(mockMakeGeminiRequest).not.toHaveBeenCalled();
  });

  test('reports valid for a working key and never echoes it', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(200));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.capabilities).toEqual({ text: true, images: true, streaming: true });
    // The candidate key flows to the upstream call as the second arg...
    expect(mockMakeGeminiRequest).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.5-flash'),
      KEY,
      expect.any(Object),
      expect.any(Number)
    );
    // ...but never leaks into the response.
    expect(JSON.stringify(data)).not.toContain(KEY);
  });

  test('maps a 401 to INVALID_KEY', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(401));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('INVALID_KEY');
  });

  test('maps Google 400 "API key not valid" to INVALID_KEY', async () => {
    // Gemini returns 400 INVALID_ARGUMENT (not 401) for a bad key.
    mockMakeGeminiRequest.mockResolvedValue(
      fakeResponse(400, {
        error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' },
      })
    );

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.error).toBe('INVALID_KEY');
  });

  test('maps a 429 to RATE_LIMITED', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(429));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.error).toBe('RATE_LIMITED');
  });

  test('rejects unsupported provider types without calling upstream', async () => {
    const response = await POST(buildRequest({ key: KEY, body: { type: 'openai-compatible' } }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('UNSUPPORTED_PROVIDER');
    expect(mockMakeGeminiRequest).not.toHaveBeenCalled();
  });
});
