/**
 * @jest-environment node
 *
 * Tests for Gemini image generation utilities
 */

// Mock the logger (must be before imports for proper hoisting)
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

import { getAIConfig } from '../config';
import {
  callGeminiImageAPI,
  extractImageFromResponse,
  generateImageWithGemini,
  type GeminiImageResponse
} from '../geminiImageGenerator';

describe('Gemini Image Generator', () => {
  describe('extractImageFromResponse', () => {
    it('should extract image data from a valid response', () => {
      const response: GeminiImageResponse = {
        candidates: [{
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64encodeddata'
                }
              }
            ]
          }
        }]
      };

      const result = extractImageFromResponse(response);

      expect(result).toEqual({
        url: 'data:image/png;base64,base64encodeddata',
        mimeType: 'image/png',
        base64Data: 'base64encodeddata'
      });
    });

    it('should return null if no candidates in response', () => {
      const response: GeminiImageResponse = {};

      const result = extractImageFromResponse(response);

      expect(result).toBeNull();
    });

    it('should return null if no parts in response', () => {
      const response: GeminiImageResponse = {
        candidates: [{
          content: {
            parts: []
          }
        }]
      };

      const result = extractImageFromResponse(response);

      expect(result).toBeNull();
    });

    it('should return null if no image part found', () => {
      const response: GeminiImageResponse = {
        candidates: [{
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'text/plain',
                  data: 'not an image'
                }
              }
            ]
          }
        }]
      };

      const result = extractImageFromResponse(response);

      expect(result).toBeNull();
    });

    it('should find image part among multiple parts', () => {
      const response: GeminiImageResponse = {
        candidates: [{
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'text/plain',
                  data: 'text content'
                }
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: 'jpegdata'
                }
              }
            ]
          }
        }]
      };

      const result = extractImageFromResponse(response);

      expect(result).toEqual({
        url: 'data:image/jpeg;base64,jpegdata',
        mimeType: 'image/jpeg',
        base64Data: 'jpegdata'
      });
    });
  });

  describe('callGeminiImageAPI', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should call the Gemini API with correct parameters', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const prompt = 'Generate a fantasy landscape';
      const apiKey = 'test-api-key';

      await callGeminiImageAPI(prompt, apiKey);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://generativelanguage.googleapis.com/v1/models/${getAIConfig().imageModelName}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              responseFormat: {
                image: {
                  aspectRatio: "1:1"
                }
              }
            }
          })
        }
      );
    });

    it('should return the fetch response', async () => {
      const mockResponse = new Response('{"success": true}', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await callGeminiImageAPI('test prompt', 'test-key');

      expect(result).toBe(mockResponse);
    });

    it('should throw if fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        callGeminiImageAPI('test prompt', 'test-key')
      ).rejects.toThrow('Network error');
    });
  });

  describe('generateImageWithGemini', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should successfully generate an image', async () => {
      const mockResponseData = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'generatedimagedata'
              }
            }]
          }
        }]
      };

      const mockResponse = new Response(JSON.stringify(mockResponseData), { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateImageWithGemini('test prompt', 'test-key');

      expect(result).toEqual({
        url: 'data:image/png;base64,generatedimagedata',
        mimeType: 'image/png',
        base64Data: 'generatedimagedata'
      });
    });

    it('should return null if API returns error status', async () => {
      const mockResponse = new Response('Error message', { status: 500 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateImageWithGemini('test prompt', 'test-key');

      expect(result).toBeNull();
    });

    it('should return null if response contains no image', async () => {
      const mockResponseData = {
        candidates: [{
          content: {
            parts: []
          }
        }]
      };

      const mockResponse = new Response(JSON.stringify(mockResponseData), { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateImageWithGemini('test prompt', 'test-key');

      expect(result).toBeNull();
    });

    it('should return null if a 200 response has a malformed JSON body', async () => {
      // A 200 OK whose body is not valid JSON: response.json() rejects.
      // This must resolve to null (placeholder fallback), not throw.
      const mockResponse = new Response('not valid json {', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateImageWithGemini('test prompt', 'test-key');

      expect(result).toBeNull();
    });

    it('should return null if fetch throws an error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await generateImageWithGemini('test prompt', 'test-key');

      expect(result).toBeNull();
    });
  });
});
