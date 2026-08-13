import { getModelCapabilities } from '../capabilities';
import { getProviderAdapter, isProviderSupported, requireProviderAdapter } from '../adapterRegistry';
import { isSafeProviderEndpoint } from '../endpointGuard';

describe('getModelCapabilities', () => {
  it('gives Gemini the native safety settings and images no one else has', () => {
    expect(getModelCapabilities('gemini', 'gemini-2.5-flash')).toMatchObject({
      images: true,
      nativeSafetySettings: true,
      systemRole: true,
    });
  });

  it('gives an unknown OpenAI-compatible model the standard defaults', () => {
    expect(getModelCapabilities('openai-compatible', 'some-new-model')).toMatchObject({
      streaming: true,
      images: false,
      systemRole: true,
      alternatingTurns: false,
      nativeSafetySettings: false,
    });
  });

  it.each([
    ['google/gemma-3-27b-it', 'systemRole', false],
    ['mistralai/Mixtral-8x7B-Instruct-v0.1', 'alternatingTurns', true],
    ['anthropic/claude-3.5-sonnet', 'systemRole', false],
  ] as const)('records the %s quirk', (model, flag, expected) => {
    expect(getModelCapabilities('openai-compatible', model)[flag]).toBe(expected);
  });

  it('does not mistake a Gemini model for a Gemma one', () => {
    expect(getModelCapabilities('openai-compatible', 'google/gemini-2.5-flash').systemRole).toBe(true);
  });
});

describe('adapter registry', () => {
  it('routes Ollama through the OpenAI-compatible adapter it actually speaks', () => {
    expect(getProviderAdapter('ollama')).toBe(getProviderAdapter('openai-compatible'));
  });

  it('has no adapter for a provider whose API is not OpenAI-shaped', () => {
    expect(getProviderAdapter('claude')).toBeNull();
    expect(isProviderSupported('claude')).toBe(false);
  });

  it('falls back to Gemini rather than throwing on the request path', () => {
    expect(requireProviderAdapter('claude').type).toBe('gemini');
  });
});

describe('isSafeProviderEndpoint', () => {
  it.each([
    'https://openrouter.ai/api/v1/chat/completions',
    'https://api.openai.com/v1/chat/completions',
  ])('allows the public provider endpoint %s', (endpoint) => {
    expect(isSafeProviderEndpoint(endpoint)).toBe(true);
  });

  it.each([
    // Cloud instance metadata — the classic SSRF target.
    'https://169.254.169.254/latest/meta-data',
    'https://127.0.0.1/v1/chat/completions',
    'https://localhost:11434/v1/chat/completions',
    'https://10.0.0.5/v1/chat/completions',
    'https://192.168.1.10/v1/chat/completions',
    'https://172.16.0.9/v1/chat/completions',
    // Plaintext would send the player's key over the wire in the clear.
    'http://api.openai.com/v1/chat/completions',
    'not-a-url',
  ])('refuses %s', (endpoint) => {
    expect(isSafeProviderEndpoint(endpoint)).toBe(false);
  });
});
