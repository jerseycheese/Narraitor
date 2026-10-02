/**
 * @jest-environment node
 */

jest.mock('@/utils/rateLimiter', () => ({
  globalRateLimiter: {
    checkLimit: jest.fn(() => ({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 3600000,
    })),
  },
  RateLimiter: {
    getErrorMessage: jest.fn(() => 'Rate limit exceeded'),
  },
}));

jest.mock('@/lib/ai/modelDiscovery', () => {
  const actual = jest.requireActual('@/lib/ai/modelDiscovery');
  return {
    ...actual,
    discoverModels: jest.fn(),
  };
});

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { discoverModels } from '@/lib/ai/modelDiscovery';
import { globalRateLimiter } from '@/utils/rateLimiter';

const mockDiscoverModels = discoverModels as jest.MockedFunction<typeof discoverModels>;

const ROUTE_URL = 'http://localhost:3000/api/ai/models';

function buildRequest(opts: { key?: string; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.key) headers['x-provider-api-key'] = opts.key;
  return new NextRequest(ROUTE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? { type: 'gemini' }),
  });
}

describe('POST /api/ai/models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 3600000,
    });
  });

  it('reads key from x-provider-api-key header and passes to discoverModels', async () => {
    mockDiscoverModels.mockResolvedValueOnce({
      models: [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }],
    });

    const request = buildRequest({
      key: 'my-candidate-key',
      body: { type: 'gemini' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.models).toHaveLength(1);
    expect(data.models[0].id).toBe('gemini-2.5-flash');

    expect(mockDiscoverModels).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gemini',
        key: 'my-candidate-key',
      })
    );
  });

  it('handles keyless requests for ollama', async () => {
    mockDiscoverModels.mockResolvedValueOnce({
      models: [{ id: 'llama3.2', name: 'llama3.2' }],
    });

    const request = buildRequest({
      body: { type: 'ollama', endpoint: 'https://ollama.example.com/v1/chat/completions' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.models[0].id).toBe('llama3.2');
    expect(mockDiscoverModels).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ollama',
        endpoint: 'https://ollama.example.com/v1/chat/completions',
        key: undefined,
      })
    );
  });

  it('returns UNSUPPORTED_PROVIDER when type is not a string', async () => {
    const request = buildRequest({
      body: { type: 12345 },
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.models).toEqual([]);
    expect(data.error).toBe('UNSUPPORTED_PROVIDER');
  });

  it('enforces rate limiting through withAIRoute', async () => {
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const request = buildRequest({ body: { type: 'gemini' } });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});
