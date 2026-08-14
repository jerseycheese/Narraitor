/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_ENDPOINT_HEADER,
  PROVIDER_MODEL_HEADER,
  PROVIDER_TYPE_HEADER,
} from '../providerKeyHeader';
import { resolveApiKey } from '../resolveApiKey';

const ORIGINAL = process.env.GEMINI_API_KEY;

function requestWithKey(key?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (key) headers[PROVIDER_API_KEY_HEADER] = key;
  return new NextRequest('http://localhost/api/x', { headers });
}

afterEach(() => {
  process.env.GEMINI_API_KEY = ORIGINAL;
});

describe('resolveApiKey', () => {
  test('prefers the request header over the env key', () => {
    process.env.GEMINI_API_KEY = 'env-key';
    expect(resolveApiKey(requestWithKey('byo-key'))).toBe('byo-key');
  });

  test('falls back to the env key when no header is present', () => {
    process.env.GEMINI_API_KEY = 'env-key';
    expect(resolveApiKey(requestWithKey())).toBe('env-key');
  });

  test('returns null when env is the MOCK sentinel and no header', () => {
    process.env.GEMINI_API_KEY = 'MOCK_API_KEY';
    expect(resolveApiKey(requestWithKey())).toBeNull();
  });

  test('returns null when neither header nor env key is present', () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveApiKey(requestWithKey())).toBeNull();
  });

  test('header wins even when env is the MOCK sentinel', () => {
    process.env.GEMINI_API_KEY = 'MOCK_API_KEY';
    expect(resolveApiKey(requestWithKey('byo-key'))).toBe('byo-key');
  });

  test('trims surrounding whitespace on the header value', () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveApiKey(requestWithKey('  spaced-key  '))).toBe('spaced-key');
  });

  test('returns null with no request and no env key', () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveApiKey()).toBeNull();
  });

  test('withholds the key when the active provider is not Gemini', () => {
    // These callers post straight to Google. Handing them a player's OpenRouter
    // key would send that key to a service it was never issued for.
    process.env.GEMINI_API_KEY = 'env-key';
    const request = new NextRequest('http://localhost/api/x', {
      headers: {
        [PROVIDER_API_KEY_HEADER]: 'openrouter-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: 'https://openrouter.ai/api/v1/chat/completions',
        [PROVIDER_MODEL_HEADER]: 'openai/gpt-4o',
      },
    });

    expect(resolveApiKey(request)).toBeNull();
  });
});
