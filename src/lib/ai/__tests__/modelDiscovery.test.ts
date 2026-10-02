/** @jest-environment node */

import {
  discoverModels,
  resolveCompatibleModelsEndpoint,
  isOpenRouterEndpoint,
  filterOpenRouterModels,
  filterGeminiModels,
  filterOpenAICompatibleModels,
  filterOllamaModels,
} from '../modelDiscovery';
import { readBoundedJson, sendProviderRequest } from '../providers/core/request';

jest.mock('../providers/core/request', () => {
  const actual = jest.requireActual('../providers/core/request');
  return {
    ...actual,
    readBoundedJson: jest.fn(actual.readBoundedJson),
    sendProviderRequest: jest.fn(),
  };
});

const mockReadBoundedJson = readBoundedJson as jest.MockedFunction<typeof readBoundedJson>;
const mockSendProviderRequest = sendProviderRequest as jest.MockedFunction<typeof sendProviderRequest>;

describe('modelDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveCompatibleModelsEndpoint', () => {
    it('preserves /v1 path prefix when replacing /chat/completions with /models', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.openai.com/v1/chat/completions')
      ).toBe('https://api.openai.com/v1/models');
    });

    it('preserves router/v1 path prefix for Perplexity Gateway', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.perplexity.ai/router/v1/chat/completions')
      ).toBe('https://api.perplexity.ai/router/v1/models');
    });

    it('handles endpoints without /v1 prefix', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/chat/completions')
      ).toBe('https://api.example.com/models');
    });

    it('handles bare completions endpoints', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/v1/completions')
      ).toBe('https://api.example.com/v1/models');
    });

    it('leaves endpoints already ending in /models intact', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/v1/models')
      ).toBe('https://api.example.com/v1/models');
    });

    it('normalizes trailing slashes on /chat/completions/ and /completions/', () => {
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/v1/chat/completions/')
      ).toBe('https://api.example.com/v1/models');
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/v1/completions/')
      ).toBe('https://api.example.com/v1/models');
      expect(
        resolveCompatibleModelsEndpoint('https://api.example.com/v1/models/')
      ).toBe('https://api.example.com/v1/models');
    });
  });

  describe('isOpenRouterEndpoint', () => {
    it('detects OpenRouter chat and models endpoints', () => {
      expect(isOpenRouterEndpoint('https://openrouter.ai/api/v1/chat/completions')).toBe(true);
      expect(isOpenRouterEndpoint('https://openrouter.ai/api/v1/models')).toBe(true);
      expect(isOpenRouterEndpoint('https://api.openai.com/v1/chat/completions')).toBe(false);
      expect(isOpenRouterEndpoint(undefined)).toBe(false);
    });
  });

  describe('filterOpenRouterModels', () => {
    it('filters unservable entries where endpoints: []', () => {
      const raw = [
        {
          id: 'retired/model',
          name: 'Retired Model',
          endpoints: [],
        },
        {
          id: 'active/model',
          name: 'Active Model',
          endpoints: [{ name: 'endpoint-1' }],
        },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result.map((m) => m.id)).toEqual(['active/model']);
    });

    it('keeps entries where endpoints is missing or undefined', () => {
      const raw = [
        {
          id: 'model/without-endpoints-field',
          name: 'Model Without Endpoints Field',
        },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result.map((m) => m.id)).toEqual(['model/without-endpoints-field']);
    });

    it('filters explicit non-text models based on architecture modality', () => {
      const raw = [
        {
          id: 'flux/image-gen',
          name: 'Flux Image Gen',
          architecture: { modality: 'text->image' },
        },
        {
          id: 'audio/speech',
          name: 'Speech Model',
          architecture: { modality: 'audio->audio' },
        },
        {
          id: 'vision/image-to-image',
          name: 'Image to Image',
          architecture: { modality: 'image->image' },
        },
        {
          id: 'deepseek/deepseek-chat',
          name: 'DeepSeek Chat',
          architecture: { modality: 'text->text' },
        },
        {
          id: 'multimodal/vision-text',
          name: 'Vision to Text',
          architecture: { modality: 'text+image->text' },
        },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result.map((m) => m.id)).toEqual([
        'deepseek/deepseek-chat',
        'multimodal/vision-text',
      ]);
    });

    it('preserves leading tilde alias IDs exactly', () => {
      const raw = [
        {
          id: '~deepseek/deepseek-flash-latest',
          name: 'DeepSeek Flash (latest)',
          endpoints: [{ name: 'ep1' }],
        },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result[0].id).toBe('~deepseek/deepseek-flash-latest');
    });

    it('deduplicates entries by ID', () => {
      const raw = [
        { id: 'meta-llama/llama-3-8b', name: 'Llama 3 8B' },
        { id: 'meta-llama/llama-3-8b', name: 'Llama 3 8B Duplicate' },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Llama 3 8B');
    });

    it('preserves supported parameters and normalized reasoning policy', () => {
      const raw = [
        {
          id: 'deepseek/deepseek-r1',
          name: 'DeepSeek R1',
          supported_parameters: ['reasoning', 'temperature'],
          reasoning: {
            mandatory: true,
            default_enabled: false,
            supported_efforts: ['low', 'high'],
            default_effort: 'high',
          },
        },
        {
          id: 'openai/gpt-4o',
          name: 'GPT-4o',
          supported_parameters: ['temperature'],
        },
      ];
      const result = filterOpenRouterModels(raw);
      expect(result[0]).toMatchObject({
        reasoning: true,
        supportedParameters: ['reasoning', 'temperature'],
        reasoningPolicy: {
          mandatory: true,
          defaultEnabled: false,
          supportedEfforts: ['low', 'high'],
          defaultEffort: 'high',
        },
      });
      expect(result[1]).toMatchObject({
        reasoning: false,
        supportedParameters: ['temperature'],
      });
      expect(result[1].reasoningPolicy).toBeUndefined();
    });

    it('uses explicit output modalities while retaining text-plus-image models', () => {
      const raw = [
        {
          id: 'vision/text-and-image',
          architecture: {
            modality: 'text->text+image',
            output_modalities: ['text', 'image'],
          },
        },
        {
          id: 'image/image-only',
          architecture: { output_modalities: ['image'] },
        },
        {
          id: 'text/text-only',
          architecture: { output_modalities: ['text'] },
        },
      ];
      expect(filterOpenRouterModels(raw).map((model) => model.id)).toEqual([
        'vision/text-and-image',
        'text/text-only',
      ]);
    });

    it('skips malformed optional metadata without dropping the catalogue', () => {
      const raw = [
        {
          id: 'provider/model',
          architecture: { modality: 12, output_modalities: 'image' },
          supported_parameters: 12,
          reasoning: {
            mandatory: 'yes',
            default_enabled: false,
            supported_efforts: ['low', 3],
            default_effort: 5,
          },
        },
        { id: 'provider/next-model' },
      ];
      expect(filterOpenRouterModels(raw)).toMatchObject([
        { id: 'provider/model', reasoning: true, reasoningPolicy: { defaultEnabled: false } },
        { id: 'provider/next-model', reasoning: false },
      ]);
      expect(filterOpenRouterModels(raw)[0].supportedParameters).toBeUndefined();
    });
  });

  describe('filterGeminiModels', () => {
    it('normalizes model IDs by stripping models/ prefix and keeps generateContent models', () => {
      const raw = [
        {
          name: 'models/gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash',
          description: 'Fast and versatile model',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/text-embedding-004',
          displayName: 'Text Embedding 004',
          supportedGenerationMethods: ['embedContent'],
        },
        {
          name: 'models/imagen-3.0-generate-002',
          displayName: 'Imagen 3',
          supportedGenerationMethods: ['predict'],
        },
      ];
      const result = filterGeminiModels(raw);
      expect(result).toEqual([
        {
          id: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          description: 'Fast and versatile model',
          contextLength: undefined,
          reasoning: false,
        },
      ]);
    });

    it('falls back to normalized ID when displayName is missing', () => {
      const raw = [
        {
          name: 'models/gemini-custom',
          supportedGenerationMethods: ['generateContent'],
        },
      ];
      const result = filterGeminiModels(raw);
      expect(result[0].name).toBe('gemini-custom');
    });

    it('filters audio-only IDs while preserving multimodal text and thinking metadata', () => {
      const raw = [
        {
          name: 'models/gemini-3.8-flash-tts',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-3.8-live-audio',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-3.1-flash-lite-image',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/gemini-2.5-flash-vision',
          supportedGenerationMethods: ['generateContent'],
          thinking: true,
        },
        {
          name: 'models/gemini-2.5-flash-image',
          supportedGenerationMethods: ['generateContent'],
        },
      ];
      const result = filterGeminiModels(raw);
      expect(result.map((model) => model.id)).toEqual([
        'gemini-3.1-flash-lite-image',
        'gemini-2.5-flash-vision',
        'gemini-2.5-flash-image',
      ]);
      expect(result[1].reasoning).toBe(true);
    });
  });

  describe('filterOpenAICompatibleModels', () => {
    it('filters out non-text models like embeddings, whisper, and dall-e', () => {
      const raw = [
        { id: 'gpt-5.6-luna' },
        { id: 'text-embedding-3-small' },
        { id: 'dall-e-3' },
        { id: 'whisper-1' },
        { id: 'tts-1' },
      ];
      const result = filterOpenAICompatibleModels(raw);
      expect(result.map((m) => m.id)).toEqual(['gpt-5.6-luna']);
    });
  });

  describe('filterOllamaModels', () => {
    it('extracts Ollama models and filters out embeddings', () => {
      const raw = [
        {
          name: 'llama3.2:latest',
          details: { family: 'llama', parameter_size: '3.2B' },
        },
        {
          name: 'nomic-embed-text:latest',
          details: { family: 'nomic-bert' },
        },
      ];
      const result = filterOllamaModels(raw);
      expect(result.map((m) => m.id)).toEqual(['llama3.2:latest']);
      expect(result[0].description).toBe('llama 3.2B');
    });
  });

  describe('discoverModels end-to-end', () => {
    it.each([
      {
        type: 'gemini' as const,
        body: { models: [] },
      },
      {
        type: 'openai-compatible' as const,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        body: { data: [] },
      },
      {
        type: 'openai-compatible' as const,
        endpoint: 'https://api.example.com/v1/chat/completions',
        body: { data: [] },
      },
      {
        type: 'ollama' as const,
        endpoint: 'https://ollama.example.com/v1/chat/completions',
        body: { models: [] },
      },
    ])('passes the deadline and abort signal to $type body reads', async (config) => {
      const signal = new AbortController().signal;
      mockSendProviderRequest.mockResolvedValueOnce(
        new Response(JSON.stringify(config.body), { status: 200 })
      );

      await discoverModels({
        type: config.type,
        endpoint: config.endpoint,
        key: 'test-key',
        signal,
      });

      expect(mockReadBoundedJson).toHaveBeenCalledWith(
        expect.any(Response),
        undefined,
        { timeoutMs: 10000, signal }
      );
    });

    it('discovers Gemini models and handles pagination', async () => {
      mockSendProviderRequest
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              models: [
                {
                  name: 'models/gemini-2.5-flash',
                  displayName: 'Gemini 2.5 Flash',
                  supportedGenerationMethods: ['generateContent'],
                },
              ],
              nextPageToken: 'page-2-token',
            }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              models: [
                {
                  name: 'models/gemini-2.5-pro',
                  displayName: 'Gemini 2.5 Pro',
                  supportedGenerationMethods: ['generateContent'],
                },
              ],
            }),
            { status: 200 }
          )
        );

      const result = await discoverModels({
        type: 'gemini',
        key: 'test-gemini-key',
      });

      expect(result.models.map((m) => m.id)).toEqual([
        'gemini-2.5-flash',
        'gemini-2.5-pro',
      ]);
      expect(mockSendProviderRequest).toHaveBeenCalledTimes(2);
      expect(mockSendProviderRequest).toHaveBeenNthCalledWith(
        1,
        'https://generativelanguage.googleapis.com/v1beta/models?pageSize=100',
        expect.objectContaining({ 'x-goog-api-key': 'test-gemini-key' }),
        null,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('does not log malformed upstream bodies or request credentials', async () => {
      const apiKey = 'sentinel-provider-key';
      const upstreamBody = `malformed response echoing ${apiKey}`;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockSendProviderRequest.mockResolvedValueOnce(new Response(upstreamBody, { status: 200 }));

      try {
        const result = await discoverModels({ type: 'gemini', key: apiKey });
        expect(result.error).toBe('NETWORK');
        const loggedArguments = warnSpy.mock.calls.flat();
        expect(loggedArguments.some((argument) => argument instanceof Error)).toBe(false);
        const logText = loggedArguments.map(String).join(' ');
        expect(logText).not.toContain(apiKey);
        expect(logText).not.toContain(upstreamBody);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('returns UNSUPPORTED_PROVIDER for claude', async () => {
      const result = await discoverModels({
        type: 'claude',
        key: 'sk-ant-test',
      });
      expect(result.models).toEqual([]);
      expect(result.error).toBe('UNSUPPORTED_PROVIDER');
    });

    it('handles keyless setup for ollama', async () => {
      mockSendProviderRequest.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: 'mistral:latest' }],
          }),
          { status: 200 }
        )
      );

      const result = await discoverModels({
        type: 'ollama',
        endpoint: 'https://ollama.example.com/v1/chat/completions',
      });

      expect(result.models.map((m) => m.id)).toEqual(['mistral:latest']);
      expect(mockSendProviderRequest).toHaveBeenCalledWith(
        'https://ollama.example.com/api/tags',
        expect.objectContaining({ 'Content-Type': 'application/json' }),
        null,
        expect.objectContaining({ method: 'GET', playerSuppliedEndpoint: true })
      );
    });

    it('maps 401/403 to INVALID_KEY', async () => {
      mockSendProviderRequest.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      );

      const result = await discoverModels({
        type: 'gemini',
        key: 'bad-key',
      });

      expect(result.models).toEqual([]);
      expect(result.error).toBe('INVALID_KEY');
    });
  });
});
