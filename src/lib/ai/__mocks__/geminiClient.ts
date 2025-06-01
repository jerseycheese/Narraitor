// __mocks__/geminiClient.ts

export const GeminiClient = jest.fn().mockImplementation(() => ({
  generateContent: jest.fn(),
}));