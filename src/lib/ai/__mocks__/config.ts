// __mocks__/config.ts

export const getAIConfig = jest.fn(() => ({
  geminiApiKey: 'test-api-key',
  modelName: 'gemini-pro',
  maxRetries: 3,
  timeout: 30000
}));

export const getGenerationConfig = jest.fn(() => ({}));
export const getSafetySettings = jest.fn(() => []);