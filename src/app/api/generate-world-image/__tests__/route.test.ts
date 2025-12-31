/**
 * @jest-environment node
 */

// Mock modules first (before imports for proper hoisting)
jest.mock('@/lib/ai/defaultGeminiClient');
jest.mock('@/lib/ai/geminiImageGenerator', () => ({
  generateImageWithGemini: jest.fn(),
  generateAndSaveImageWithGemini: jest.fn(),
}));
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});
jest.mock('@/lib/utils/genrePromptGuide', () => ({
  getGenreStyleGuidance: jest.fn((genre: string, context: string) => {
    return `Mocked style guidance for ${genre} ${context}`;
  }),
  getGenreFallbackImage: jest.fn((genre: string, seed: string) => {
    return `https://picsum.photos/seed/${seed}/800/600`;
  }),
}));

// Now import modules
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { generateImageWithGemini, generateAndSaveImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import type { World } from '@/types/world.types';

// Create typed mocks
const mockCreateDefaultGeminiClient = createDefaultGeminiClient as jest.MockedFunction<typeof createDefaultGeminiClient>;
const mockGenerateImageWithGemini = generateImageWithGemini as jest.MockedFunction<typeof generateImageWithGemini>;
const mockGenerateAndSaveImageWithGemini = generateAndSaveImageWithGemini as jest.MockedFunction<typeof generateAndSaveImageWithGemini>;

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
    derivedStats: [],    settings: {
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
    mockCreateDefaultGeminiClient.mockReturnValue(mockGeminiClient as unknown as ReturnType<typeof createDefaultGeminiClient>);
    
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
        content: customPrompt // Use custom prompt directly when provided
      });

      mockGenerateAndSaveImageWithGemini.mockResolvedValue({
        url: '/uploads/worlds/test-world.png',
        fileSize: 102400
      });

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
      expect(data.imageUrl).toBe('/uploads/worlds/test-world.png');
      expect(data.description).toBe(customPrompt);
    });

    it('should generate prompt when custom prompt not provided', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'AI-generated detailed description'
      });

      mockGenerateImageWithGemini.mockResolvedValue({
        url: 'data:image/jpeg;base64,base64imagedata',
        mimeType: 'image/jpeg',
        base64Data: 'base64imagedata'
      });

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
    it('should generate appropriate fallback for different genres', async () => {
      // Mock no API key to force fallback
      delete process.env.GEMINI_API_KEY;

      const testGenres = ['fantasy', 'sci-fi', 'cyberpunk'];
      
      for (const genre of testGenres) {
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
      }
    });
  });

  describe('AI Image Generation', () => {
    it('should successfully generate AI image when Gemini API responds with image', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated image description'
      });

      mockGenerateAndSaveImageWithGemini.mockResolvedValue({
        url: '/uploads/worlds/test-world.png',
        fileSize: 102400
      });

      const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
        method: 'POST',
        body: JSON.stringify({ world: mockWorld }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiGenerated).toBe(true);
      expect(data.placeholder).toBe(false);
      expect(data.imageUrl).toBe('/uploads/worlds/test-world.png');
      expect(data.service).toBe('gemini-image-generation');
      expect(mockGenerateAndSaveImageWithGemini).toHaveBeenCalled();
    });

    it('should fallback to placeholder when Gemini API fails', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        content: 'Generated description'
      });

      mockGenerateAndSaveImageWithGemini.mockResolvedValue(null);

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

      mockGenerateAndSaveImageWithGemini.mockResolvedValue(null);

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

      mockGenerateAndSaveImageWithGemini.mockResolvedValue(null);

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
    it('should use fallback when API key is not configured or is mock', async () => {
      const testCases = [
        { key: undefined, description: 'no API key' },
        { key: 'MOCK_API_KEY', description: 'mock API key' }
      ];

      for (const { key } of testCases) {
        if (key) {
          process.env.GEMINI_API_KEY = key;
        } else {
          delete process.env.GEMINI_API_KEY;
        }

        const request = new NextRequest('http://localhost:3000/api/generate-world-image', {
          method: 'POST',
          body: JSON.stringify({ world: mockWorld }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.placeholder).toBe(true);
        expect(data.aiGenerated).toBe(false);
        expect(mockGenerateImageWithGemini).not.toHaveBeenCalled();
      }
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

});