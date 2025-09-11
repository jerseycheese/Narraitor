/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import type { World } from '@/types/world.types';

// Mock the Gemini client
jest.mock('@/lib/ai/defaultGeminiClient');
const mockCreateDefaultGeminiClient = createDefaultGeminiClient as jest.MockedFunction<typeof createDefaultGeminiClient>;

// Mock fetch for Gemini API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Logger
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});

describe('/api/generate-world-image', () => {
  const mockWorld: World = {
    id: 'test-world',
    name: 'Test Fantasy World',
    description: 'A magical realm filled with ancient forests and mystical creatures',
    genre: 'fantasy',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 25,
      skillPointPool: 30,
    },
  };

  const mockGeminiClient = {
    generateContent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDefaultGeminiClient.mockReturnValue(mockGeminiClient as any);
    
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Request Validation', () => {
    it('should return 400 when no world data is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('World data is required');
    });

    it('should return 400 when world data is null', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: null }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('World data is required');
    });
  });

  describe('Custom Prompt Handling', () => {
    it('should use custom prompt when provided', async () => {
      const customPrompt = 'A dark and stormy castle on a hilltop';
      
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Enhanced description based on custom prompt'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64imagedata'
                }
              }]
            }
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ 
          world: mockWorld,
          customPrompt 
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(true);
      expect(data.placeholder).toBe(false);
      expect(data.imageUrl).toContain('data:image/png;base64,');
      expect(data.description).toBe(customPrompt);
    });

    it('should generate prompt when custom prompt not provided', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'AI-generated detailed description'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: 'base64imagedata'
                }
              }]
            }
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
      expect(data.description).toBe('AI-generated detailed description');
    });
  });

  describe('Genre-Specific Image Generation', () => {
    const genreTestCases = [
      { genre: 'fantasy', expectedStyle: 'magical elements' },
      { genre: 'sci-fi', expectedStyle: 'futuristic' },
      { genre: 'horror', expectedStyle: 'dark, ominous' },
      { genre: 'western', expectedStyle: 'wild west' },
      { genre: 'cyberpunk', expectedStyle: 'neon-lit cyberpunk' },
      { genre: 'steampunk', expectedStyle: 'steam-powered machinery' },
      { genre: 'post-apocalyptic', expectedStyle: 'desolate post-apocalyptic' },
      { genre: 'biopunk/gothic horror', expectedStyle: 'bio-organic gothic' },
    ];

    genreTestCases.forEach(({ genre, expectedStyle }) => {
      it(`should generate appropriate fallback for ${genre} genre`, async () => {
        // Mock no API key to force fallback
        delete process.env.GEMINI_API_KEY;

        const worldWithGenre = { ...mockWorld, genre };
        const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
          method: 'POST',
          body: JSON.stringify({ world: worldWithGenre }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.placeholder).toBe(true);
        expect(data.aiGenerated).toBe(false);
        expect(data.imageUrl).toContain('picsum.photos');
        expect(data.imageUrl).toContain(worldWithGenre.name);
      });
    });
  });

  describe('AI Image Generation', () => {
    it('should successfully generate AI image when Gemini API responds with image', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated image description'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64encodedimagedata'
                }
              }]
            }
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(true);
      expect(data.placeholder).toBe(false);
      expect(data.imageUrl).toBe('data:image/png;base64,base64encodedimagedata');
      expect(data.service).toBe('gemini-image-generation');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-goog-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should fallback to placeholder when Gemini API fails', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated description'
      });

      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('API Error'),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(false);
      expect(data.placeholder).toBe(true);
      expect(data.imageUrl).toContain('picsum.photos');
    });

    it('should fallback to placeholder when Gemini API response has no image', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated description'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Text response without image'
              }]
            }
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(false);
      expect(data.placeholder).toBe(true);
      expect(data.imageUrl).toContain('picsum.photos');
    });

    it('should fallback to placeholder when network error occurs', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated description'
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(false);
      expect(data.placeholder).toBe(true);
      expect(data.imageUrl).toContain('picsum.photos');
    });
  });

  describe('Environment Configuration', () => {
    it('should use fallback when no API key is configured', async () => {
      delete process.env.GEMINI_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.placeholder).toBe(true);
      expect(data.aiGenerated).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use fallback when API key is mock key', async () => {
      process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.placeholder).toBe(true);
      expect(data.aiGenerated).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI prompt generation failure gracefully', async () => {
      mockGeminiClient.generateContent.mockRejectedValue(new Error('AI Error'));

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.placeholder).toBe(true);
      expect(data.aiGenerated).toBe(false);
      expect(data.description).toContain(mockWorld.genre);
      expect(data.description).toContain(mockWorld.name);
    });

    it('should return 500 when request parsing fails', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate world image. Please try again.');
    });
  });

  describe('Response Format', () => {
    it('should return all expected fields in response', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Test description'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'image/png',
                  data: 'testdata'
                }
              }]
            }
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('imageUrl');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('prompt');
      expect(data).toHaveProperty('placeholder');
      expect(data).toHaveProperty('aiGenerated');
      expect(data).toHaveProperty('imageGenerationPrompt');
      expect(data).toHaveProperty('service');
    });
  });
});