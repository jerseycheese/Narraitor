/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_CUSTOM_SAFETY_PROMPT_HEADER,
  PROVIDER_CUSTOM_SYSTEM_PROMPT_HEADER,
  PROVIDER_ENDPOINT_HEADER,
  PROVIDER_MAX_TOKENS_HEADER,
  PROVIDER_MODEL_HEADER,
  PROVIDER_TEMPERATURE_HEADER,
  PROVIDER_TOP_P_HEADER,
  PROVIDER_TYPE_HEADER,
} from '../providerKeyHeader';
import { resolveProvider } from '../resolveApiKey';
import { DEFAULT_TEXT_MODEL } from '../config';

const ORIGINAL = process.env.GEMINI_API_KEY;

const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';

function requestWith(headers: Record<string, string | undefined>): NextRequest {
  const defined = Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
  return new NextRequest('http://localhost/api/x', { headers: defined });
}

afterEach(() => {
  process.env.GEMINI_API_KEY = ORIGINAL;
});

describe('resolveProvider', () => {
  it('defaults to Gemini when only a key is sent, as every pre-multi-provider session did', () => {
    const resolution = resolveProvider(requestWith({ [PROVIDER_API_KEY_HEADER]: 'byo-key' }));

    expect(resolution).toEqual({
      ok: true,
      descriptor: { type: 'gemini', endpoint: '', model: DEFAULT_TEXT_MODEL, apiKey: 'byo-key' },
    });
  });

  it('resolves the whole descriptor for a configured OpenAI-compatible provider', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: OPENROUTER,
        [PROVIDER_MODEL_HEADER]: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      })
    );

    expect(resolution).toEqual({
      ok: true,
      descriptor: {
        type: 'openai-compatible',
        endpoint: OPENROUTER,
        // Vendor-prefixed ids are the norm off Gemini and must survive.
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        apiKey: 'byo-key',
        // Attached from the OpenRouter preset because that is where this
        // request is going, not because anything in it said so.
        customHeaders: {
          'HTTP-Referer': 'https://narraitor-six.vercel.app',
          'X-OpenRouter-Title': 'Narraitor',
        },
      },
    });
  });

  it('attaches no preset headers to an endpoint it does not ship a preset for', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: 'https://some-other-service.test/v1/chat/completions',
        [PROVIDER_MODEL_HEADER]: 'some-model',
      })
    );

    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.descriptor.customHeaders).toBeUndefined();
  });

  it('carries a well-formed advanced-settings override onto the descriptor', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: OPENROUTER,
        [PROVIDER_MODEL_HEADER]: 'openai/gpt-4o',
        [PROVIDER_TEMPERATURE_HEADER]: '1.4',
        [PROVIDER_TOP_P_HEADER]: '0.9',
        [PROVIDER_MAX_TOKENS_HEADER]: '3000',
        [PROVIDER_CUSTOM_SAFETY_PROMPT_HEADER]: 'Keep it cinematic, not graphic.',
        [PROVIDER_CUSTOM_SYSTEM_PROMPT_HEADER]: 'Use spare prose.',
      })
    );

    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.descriptor.temperatureOverride).toBe(1.4);
    expect(resolution.ok && resolution.descriptor.topPOverride).toBe(0.9);
    expect(resolution.ok && resolution.descriptor.maxTokensOverride).toBe(3000);
    expect(resolution.ok && resolution.descriptor.customSafetyPromptOverride).toBe(
      'Keep it cinematic, not graphic.'
    );
    expect(resolution.ok && resolution.descriptor.customSystemPromptOverride).toBe('Use spare prose.');
  });

  it('drops an out-of-range advanced-settings override rather than passing it through', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TEMPERATURE_HEADER]: '9',
        [PROVIDER_TOP_P_HEADER]: 'not-a-number',
      })
    );

    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.descriptor.temperatureOverride).toBeUndefined();
    expect(resolution.ok && resolution.descriptor.topPOverride).toBeUndefined();
  });

  it("carries OpenAI's renamed output cap onto the descriptor, keyed off the endpoint", () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: 'https://api.openai.com/v1/chat/completions',
        [PROVIDER_MODEL_HEADER]: 'gpt-5.6-luna',
      })
    );

    // Without this the adapter sends max_tokens and OpenAI 400s the request.
    expect(resolution.ok && resolution.descriptor.maxOutputTokensParam).toBe(
      'max_completion_tokens'
    );
  });

  it('leaves the output cap unnamed for a service that never moved off max_tokens', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: OPENROUTER,
        [PROVIDER_MODEL_HEADER]: 'openai/gpt-4o',
      })
    );

    expect(resolution.ok && resolution.descriptor.maxOutputTokensParam).toBeUndefined();
  });

  it('reports NO_KEY when neither a header nor a usable env key exists', () => {
    process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

    expect(resolveProvider(requestWith({}))).toEqual({ ok: false, reason: 'NO_KEY' });
  });

  it('rejects a provider type we have no adapter for', () => {
    const resolution = resolveProvider(
      requestWith({ [PROVIDER_API_KEY_HEADER]: 'byo-key', [PROVIDER_TYPE_HEADER]: 'claude' })
    );

    expect(resolution).toEqual({ ok: false, reason: 'UNSUPPORTED_PROVIDER' });
  });

  it('rejects an endpoint the server should never dereference', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: 'https://169.254.169.254/latest/meta-data',
        [PROVIDER_MODEL_HEADER]: 'gpt-4o',
      })
    );

    expect(resolution).toEqual({ ok: false, reason: 'INVALID_ENDPOINT' });
  });

  it('will not substitute a default model for a non-Gemini provider', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: OPENROUTER,
      })
    );

    expect(resolution).toEqual({ ok: false, reason: 'INVALID_MODEL' });
  });

  it('still refuses a Gemini model id that could steer the REST path', () => {
    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_API_KEY_HEADER]: 'byo-key',
        [PROVIDER_MODEL_HEADER]: '../../models/other:generateContent',
      })
    );

    expect(resolution).toMatchObject({ ok: true, descriptor: { model: DEFAULT_TEXT_MODEL } });
  });

  /**
   * The env key belongs to the deployment, not to the caller. Honouring routing
   * headers without a caller-supplied key would let anyone name an endpoint and
   * have the server post that key to it.
   */
  it('ignores routing headers on the env-key path', () => {
    process.env.GEMINI_API_KEY = 'env-key';

    const resolution = resolveProvider(
      requestWith({
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: 'https://attacker.test/collect',
        [PROVIDER_MODEL_HEADER]: 'anything',
      })
    );

    expect(resolution).toEqual({
      ok: true,
      descriptor: { type: 'gemini', endpoint: '', model: DEFAULT_TEXT_MODEL, apiKey: 'env-key' },
    });
  });
});
