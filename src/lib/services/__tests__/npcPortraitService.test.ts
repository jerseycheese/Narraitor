// src/lib/services/__tests__/npcPortraitService.test.ts

import { npcPortraitService } from '../npcPortraitService';
import { NPC } from '@/types/npc.types';
import { World } from '@/types/world.types';
import { getTimestamp } from '@/lib/utils';
import { useNPCStore } from '@/state/npcStore';

// Mock dependencies
jest.mock('@/state/npcStore');
jest.mock('@/lib/utils/logger');

// Mock fetch globally
global.fetch = jest.fn();

describe('npcPortraitService', () => {
  let mockNPCStore: {
    npcs: Record<string, NPC>;
    updateNPC: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear in-memory cache between tests
    npcPortraitService.clearCache();

    // Setup mock NPC store
    mockNPCStore = {
      npcs: {},
      updateNPC: jest.fn()
    };

    (useNPCStore as unknown as jest.Mock).mockReturnValue(mockNPCStore);
    (useNPCStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockNPCStore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockNPC = (overrides?: Partial<NPC>): NPC => ({
    id: 'npc-1',
    name: 'Elara Moonwhisper',
    description: 'A mysterious elven ranger with silver hair',
    worldId: 'world-1',
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    ...overrides
  });

  const createMockWorld = (overrides?: Partial<World>): World => ({
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    genre: 'fantasy',
    attributes: [],
      skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    toneSettings: {
      contentRating: 'PG',
      narrativeStyle: 'balanced',
      languageComplexity: 'moderate'
    },
    ...overrides
  });

  describe('generateForNPC', () => {
    it('should call /api/generate-portrait with correct payload', async () => {
      const npc = createMockNPC();
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      const mockResponse = {
        portrait: {
          type: 'ai-generated',
          url: 'https://example.com/portrait.jpg',
          generatedAt: getTimestamp(),
          prompt: 'Test prompt'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await npcPortraitService.generateForNPC(npc.id, world);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-portrait',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Elara Moonwhisper')
        })
      );

      // Parse the body to verify structure
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toHaveProperty('character');
      expect(body.character.name).toBe('Elara Moonwhisper');
      expect(body).toHaveProperty('world');
      expect(body.world.genre).toBe('fantasy');

      expect(result).toBe('https://example.com/portrait.jpg');
    });

    it('should include world genre in the request payload', async () => {
      const npc = createMockNPC();
      const world = createMockWorld({ genre: 'sci-fi' });

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          portrait: {
            type: 'ai-generated',
            url: 'https://example.com/portrait.jpg',
            generatedAt: getTimestamp(),
            prompt: 'Test prompt'
          }
        })
      } as Response);

      await npcPortraitService.generateForNPC(npc.id, world);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.world.genre).toBe('sci-fi');
    });

    it('should include world toneSettings in the request payload', async () => {
      const npc = createMockNPC();
      const world = createMockWorld({
        toneSettings: {
          contentRating: 'PG-13',
          narrativeStyle: 'action-packed',
          languageComplexity: 'simple'
        }
      });

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          portrait: {
            type: 'ai-generated',
            url: 'https://example.com/portrait.jpg',
            generatedAt: getTimestamp(),
            prompt: 'Test prompt'
          }
        })
      } as Response);

      await npcPortraitService.generateForNPC(npc.id, world);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.world.toneSettings).toEqual({
        contentRating: 'PG-13',
        narrativeStyle: 'action-packed',
        languageComplexity: 'simple'
      });
    });

    it('should use NPC description as customDescription when avatarPrompt is not available', async () => {
      const npc = createMockNPC({
        description: 'A mysterious elven ranger',
        avatarUrl: undefined
      });
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          portrait: {
            type: 'ai-generated',
            url: 'https://example.com/portrait.jpg',
            generatedAt: getTimestamp(),
            prompt: 'Test prompt'
          }
        })
      } as Response);

      await npcPortraitService.generateForNPC(npc.id, world);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.customDescription).toBe('A mysterious elven ranger');
    });

    it('should cache portrait URLs to prevent duplicate requests', async () => {
      const npc = createMockNPC();
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          portrait: {
            type: 'ai-generated',
            url: 'https://example.com/portrait.jpg',
            generatedAt: getTimestamp(),
            prompt: 'Test prompt'
          }
        })
      } as Response);

      // First call
      const result1 = await npcPortraitService.generateForNPC(npc.id, world);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await npcPortraitService.generateForNPC(npc.id, world);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toBe(result1);
    });

    it('should handle fetch errors gracefully', async () => {
      const npc = createMockNPC();
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        npcPortraitService.generateForNPC(npc.id, world)
      ).rejects.toThrow('Network error');
    });

    it('should handle non-ok HTTP responses', async () => {
      const npc = createMockNPC();
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(
        npcPortraitService.generateForNPC(npc.id, world)
      ).rejects.toThrow();
    });
  });

  describe('bootstrapNpcPortraits', () => {
    it('should generate portraits for NPCs without avatarUrl', async () => {
      // This test will be implemented when we integrate with npcStore
      expect(npcPortraitService.bootstrapNpcPortraits).toBeDefined();
    });

    it('should skip NPCs that already have avatarUrl', async () => {
      // This test will be implemented when we integrate with npcStore
      expect(npcPortraitService.bootstrapNpcPortraits).toBeDefined();
    });

    it('should add rate limiting delays between portrait generations', async () => {
      // This test will be implemented when we integrate with npcStore
      expect(npcPortraitService.bootstrapNpcPortraits).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear the in-memory cache', async () => {
      const npc = createMockNPC();
      const world = createMockWorld();

      // Add NPC to mock store
      mockNPCStore.npcs[npc.id] = npc;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          portrait: {
            type: 'ai-generated',
            url: 'https://example.com/portrait.jpg',
            generatedAt: getTimestamp(),
            prompt: 'Test prompt'
          }
        })
      } as Response);

      // First call
      await npcPortraitService.generateForNPC(npc.id, world);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      npcPortraitService.clearCache();

      // Second call - should hit network again
      await npcPortraitService.generateForNPC(npc.id, world);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
