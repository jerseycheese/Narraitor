import type { AIResponse } from '../../types';
import type { ProviderDescriptor } from '../types';

const mockGenerateContent = jest.fn<Promise<AIResponse>, [string, unknown?]>(async () => ({
  content: 'ok',
  finishReason: 'STOP',
}));

const mockGeminiClient = jest.fn().mockImplementation(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('../../geminiClient', () => ({
  GeminiClient: mockGeminiClient,
}));

import { createProviderClient } from '../factory';
import { ClaudeClient } from '../claude/client';
import { OpenAICompatibleClient } from '../openai-compatible/client';
import { claudeAdapter } from '../claude/adapter';
import { openAICompatibleAdapter } from '../openai-compatible/adapter';

const GEMINI_DESCRIPTOR: ProviderDescriptor = {
  type: 'gemini',
  endpoint: '',
  model: 'gemini-2.5-pro',
  apiKey: 'player-key',
};

const CLAUDE_DESCRIPTOR: ProviderDescriptor = {
  type: 'claude',
  endpoint: '',
  model: 'claude-sonnet-5',
  apiKey: 'player-key',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createProviderClient', () => {
  it('carries Gemini descriptor generation overrides into the SDK client', () => {
    createProviderClient({
      ...GEMINI_DESCRIPTOR,
      temperatureOverride: 1.4,
      topPOverride: 0.8,
      maxTokensOverride: 512,
    });

    expect(mockGeminiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'player-key',
        modelName: 'gemini-2.5-pro',
        generationConfig: expect.objectContaining({
          temperature: 1.4,
          topP: 0.8,
          maxOutputTokens: 512,
        }),
      })
    );
  });

  it('applies Gemini prompt overrides before generation', async () => {
    const client = createProviderClient({
      ...GEMINI_DESCRIPTOR,
      customSafetyPromptOverride: 'Keep violence implied.',
      customSystemPromptOverride: 'Use spare prose.',
    });

    await client.generateContent('Continue the story.');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Safety guidance:\nKeep violence implied.')
    );
    expect(mockGenerateContent.mock.calls[0][0]).toContain(
      'Additional system instructions:\nUse spare prose.'
    );
    expect(mockGenerateContent.mock.calls[0][0]).toContain('Continue the story.');
  });

  it('builds a ClaudeClient with claudeAdapter for a claude descriptor', () => {
    const client = createProviderClient(CLAUDE_DESCRIPTOR);

    expect(client).toBeInstanceOf(ClaudeClient);
    expect((client as unknown as { adapter: unknown }).adapter).toBe(claudeAdapter);
  });

  it('builds an OpenAICompatibleClient with openAICompatibleAdapter for an openai-compatible descriptor', () => {
    const client = createProviderClient({
      type: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'openai/gpt-4o',
      apiKey: 'player-key',
    });

    expect(client).toBeInstanceOf(OpenAICompatibleClient);
    expect((client as unknown as { adapter: unknown }).adapter).toBe(openAICompatibleAdapter);
  });
});
