// src/lib/ai/__tests__/geminiClient.test.ts

import { GeminiClient } from '../geminiClient';
import { AIServiceConfig } from '../types';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  const GoogleGenAI = jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI };
});

const { GoogleGenAI } = require('@google/genai');

const networkError = new Error('network error');

describe('GeminiClient', () => {
  jest.useFakeTimers();
  let client: GeminiClient;
  let config: AIServiceConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent.mockReset();
    
    config = {
      apiKey: 'test-api-key',
      modelName: 'gemini-2.0-flash', 
      maxRetries: 3,
      timeout: 30000,
      generationConfig: {
        temperature: 0.7,
        topP: 1.0,
        topK: 40,
        maxOutputTokens: 2048
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };
  });

  describe('constructor', () => {
    test('should initialize with config', () => {
      client = new GeminiClient(config);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('generateContent', () => {
    test('should generate content successfully', async () => {
      // Mock successful response from SDK
      const mockSDKResponse = {
        text: 'Generated test content',
        result: {
          finishReason: 'STOP'
        }
      };
      mockGenerateContent.mockResolvedValueOnce(mockSDKResponse);

      client = new GeminiClient(config);
      const result = await client.generateContent('Test prompt');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash',
        contents: 'Test prompt',
        config: {
          generationConfig: config.generationConfig,
          safetySettings: config.safetySettings
        }
      });
      expect(result).toEqual({
        content: 'Generated test content',
        finishReason: 'STOP',
        promptTokens: undefined,
        completionTokens: undefined
      });
    });

    test('should retry on transient errors', async () => {
      // Simulate two failures followed by success - use network error message
      const mockSDKResponse = {
        text: 'Generated after retry',
        result: {
          finishReason: 'STOP'
        }
      };

      mockGenerateContent
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockSDKResponse);

      client = new GeminiClient(config);
      const promise = client.generateContent('Test prompt');

      // Advance timers to trigger retries
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result.content).toBe('Generated after retry');
    });

    test('should throw after max retries', async () => {
      // Use error that will be detected as retryable
      mockGenerateContent.mockRejectedValue(networkError);

      client = new GeminiClient(config);

      const promise = client.generateContent('Test prompt');
      const expectation = expect(promise).rejects.toThrow('network error');

      await jest.runAllTimersAsync();

      await expectation;

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    test('should not retry non-retryable errors', async () => {
      const authError = new Error('Invalid API key');
      mockGenerateContent.mockRejectedValueOnce(authError);

      client = new GeminiClient(config);
      
      await expect(client.generateContent('Test prompt'))
        .rejects
        .toThrow('Invalid API key');
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    test('should handle SDK response formats', async () => {
      // Test various SDK response formats
      const mockSDKResponse = {
        text: 'Test response',
        result: {
          finishReason: 'MAX_TOKENS'
        }
      };
      mockGenerateContent.mockResolvedValueOnce(mockSDKResponse);

      client = new GeminiClient(config);
      const result = await client.generateContent('Test prompt');

      expect(result).toEqual({
        content: 'Test response',
        finishReason: 'MAX_TOKENS',
        promptTokens: undefined,
        completionTokens: undefined
      });
    });

    test('should handle empty responses', async () => {
      const mockSDKResponse = {
        text: '',
        result: {
          finishReason: 'STOP'
        }
      };
      mockGenerateContent.mockResolvedValueOnce(mockSDKResponse);

      client = new GeminiClient(config);
      const result = await client.generateContent('Test prompt');

      expect(result).toEqual({
        content: '',
        finishReason: 'STOP',
        promptTokens: undefined,
        completionTokens: undefined
      });
    });
  });

  describe('configuration options', () => {
    test('should use provided generation config', async () => {
      const customConfig = {
        ...config,
        generationConfig: {
          temperature: 0.9,
          topP: 0.8,
          topK: 30,
          maxOutputTokens: 1024
        }
      };

      const mockSDKResponse = {
        text: 'Test',
        result: {
          finishReason: 'STOP'
        }
      };
      mockGenerateContent.mockResolvedValueOnce(mockSDKResponse);

      client = new GeminiClient(customConfig);
      await client.generateContent('Test prompt');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash',
        contents: 'Test prompt',
        config: {
          generationConfig: customConfig.generationConfig,
          safetySettings: customConfig.safetySettings
        }
      });
    });
  });
});
