// __mocks__/config.ts

export const getAIConfig = jest.fn(() => ({
  geminiApiKey: 'test-api-key',
  modelName: 'gemini-pro',
  maxRetries: 3,
  timeout: 30000
}));

export const getGenerationConfig = jest.fn(() => ({}));
export const getSafetySettings = jest.fn(() => []);

export const resolveEffectiveGeminiKey = jest.fn((requestKey?: string | null) =>
  requestKey ?? ''
);

export const getDefaultConfig = jest.fn((apiKeyOverride?: string | null, modelOverride?: string | null) => ({
  apiKey: resolveEffectiveGeminiKey(apiKeyOverride),
  modelName: modelOverride ?? 'gemini-pro',
  maxRetries: 3,
  timeout: 30000,
  generationConfig: getGenerationConfig(),
  safetySettings: getSafetySettings(),
}));
