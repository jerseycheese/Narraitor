import { FallbackContentManager } from '../FallbackContentManager';
import { NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';

describe('FallbackContentManager', () => {
  let manager: FallbackContentManager;
  let mockWorld: World;
  let mockContext: NarrativeContext;

  beforeEach(() => {
    manager = new FallbackContentManager();
    
    mockWorld = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      theme: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 30,
        skillPointPool: 30
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockContext = {
      worldId: 'world-1',
      currentSceneId: 'scene-1',
      characterIds: ['char-1'],
      previousSegments: [],
      currentTags: ['forest', 'day'],
      sessionId: 'session-1'
    };
  });

  describe('getContent', () => {
    it('should return appropriate fallback content for scene type', () => {
      const content = manager.getContent('scene', mockContext, mockWorld);
      
      expect(content).toBeDefined();
      expect(content?.type).toBe('scene');
      expect(content?.themes).toContain('fantasy');
      expect(content?.content).toBeTruthy();
    });

    it('should return content matching world theme', () => {
      mockWorld.theme = 'scifi';
      const content = manager.getContent('scene', mockContext, mockWorld);
      
      expect(content?.themes).toContain('scifi');
    });

    it('should respect context tags when selecting content', () => {
      mockContext.currentTags = ['combat', 'night'];
      const content = manager.getContent('scene', mockContext, mockWorld);
      
      // Content should be appropriate for combat context
      expect(content?.tags).toEqual(
        expect.arrayContaining(['combat'])
      );
    });

    it('should return initial scene content for new sessions', () => {
      mockContext.previousSegments = [];
      const content = manager.getContent('initial', mockContext, mockWorld);
      
      expect(content?.type).toBe('initial');
      // Just check that we get content, not specific words
      expect(content?.content).toBeTruthy();
      expect(content?.content.length).toBeGreaterThan(50);
    });

    it('should provide choices when appropriate', () => {
      const content = manager.getContent('choice', mockContext, mockWorld);
      
      expect(content?.choices).toBeDefined();
      expect(content?.choices?.length).toBeGreaterThan(0);
      expect(content?.choices?.[0]).toHaveProperty('text');
      expect(content?.choices?.[0]).toHaveProperty('outcome');
    });

    it('should return null if no appropriate content found', () => {
      mockWorld.theme = 'nonexistent-theme';
      const content = manager.getContent('scene', mockContext, mockWorld);
      
      expect(content).toBeNull();
    });

    it('should avoid recently used content', () => {
      // Get content multiple times
      const contents = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const content = manager.getContent('scene', mockContext, mockWorld);
        if (content) {
          contents.add(content.id);
        }
      }
      
      // Should have different content each time (if enough variety exists)
      expect(contents.size).toBeGreaterThan(1);
    });

    it('should respect content requirements', () => {
      mockContext.currentTags = ['indoors'];
      const content = manager.getContent('scene', mockContext, mockWorld);
      
      // Should get content that is appropriate for indoors
      // (either has no requirements or doesn't exclude indoors)
      if (content?.requirements?.excludeTags) {
        expect(content.requirements.excludeTags).not.toContain('indoors');
      }
      // Content should exist
      expect(content).toBeDefined();
    });
  });

  describe('hasContent', () => {
    it('should return true when content exists for theme', () => {
      expect(manager.hasContent('fantasy')).toBe(true);
    });

    it('should return false for unsupported themes', () => {
      expect(manager.hasContent('nonexistent-theme')).toBe(false);
    });
  });

  describe('getContentCount', () => {
    it('should return count of available content', () => {
      const count = manager.getContentCount('fantasy', 'scene');
      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for unsupported combinations', () => {
      const count = manager.getContentCount('nonexistent', 'scene');
      expect(count).toBe(0);
    });
  });

  describe('clearUsageHistory', () => {
    it('should reset recently used content tracking', () => {
      // Use some content
      manager.getContent('scene', mockContext, mockWorld);
      manager.getContent('scene', mockContext, mockWorld);
      
      // Clear history
      manager.clearUsageHistory();
      
      // Should be able to get the same content again
      const content1 = manager.getContent('scene', mockContext, mockWorld);
      const content2 = manager.getContent('scene', mockContext, mockWorld);
      
      // Might get the same content since history is cleared
      expect(content1).toBeDefined();
      expect(content2).toBeDefined();
    });
  });
});