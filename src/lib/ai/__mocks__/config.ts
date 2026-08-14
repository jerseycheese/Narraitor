// __mocks__/config.ts

export const getAIConfig = jest.fn(() => ({
  geminiApiKey: 'test-api-key',
  modelName: 'gemini-pro',
  maxRetries: 3,
  timeout: 30000
}));

export const getGenerationConfig = jest.fn(() => ({}));
export const getSafetySettings = jest.fn(() => []);

// Keeps the real distinction: an omitted key falls back to the server key, an
// explicit null does not.
export const resolveEffectiveGeminiKey = jest.fn((requestKey?: string | null) =>
  requestKey === undefined ? 'test-api-key' : requestKey ?? ''
);
