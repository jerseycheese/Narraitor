import { ContentSelector } from '../ContentSelector';
import { FallbackContent, ContentSelectionCriteria } from '../types';

describe('ContentSelector', () => {
  let selector: ContentSelector;
  let mockContent: FallbackContent[];

  beforeEach(() => {
    selector = new ContentSelector();
    
    mockContent = [
      {
        id: 'fantasy-forest-1',
        type: 'scene',
        themes: ['fantasy'],
        tags: ['forest', 'day', 'peaceful'],
        content: 'You find yourself in a peaceful forest glade...',
        weight: 1
      },
      {
        id: 'fantasy-forest-2',
        type: 'scene',
        themes: ['fantasy', 'adventure'],
        tags: ['forest', 'mysterious'],
        content: 'The forest path ahead splits in two directions...',
        weight: 2,
        choices: [
          { text: 'Take the left path', outcome: 'You head down the shadowy left path...', tags: ['left_path'] },
          { text: 'Take the right path', outcome: 'You follow the sunlit right path...', tags: ['right_path'] }
        ]
      },
      {
        id: 'fantasy-combat-1',
        type: 'scene',
        themes: ['fantasy'],
        tags: ['combat', 'forest'],
        content: 'A wild creature emerges from the undergrowth!',
        requirements: {
          includeTags: ['forest'],
          minSegments: 2
        }
      },
      {
        id: 'scifi-ship-1',
        type: 'scene',
        themes: ['scifi'],
        tags: ['spaceship', 'interior'],
        content: 'The ship\'s corridors hum with electronic life...'
      },
      {
        id: 'fantasy-init-1',
        type: 'initial',
        themes: ['fantasy'],
        tags: ['beginning'],
        content: 'Your adventure begins in the kingdom of...'
      }
    ];
  });

  describe('selectContent', () => {
    it('should select content matching all criteria', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest'],
        segmentCount: 0,
        recentlyUsedIds: []
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected).toBeDefined();
      expect(selected?.type).toBe('scene');
      expect(selected?.themes).toContain('fantasy');
    });

    it('should prefer content with matching tags', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest', 'mysterious'],
        segmentCount: 0,
        recentlyUsedIds: []
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected?.id).toBe('fantasy-forest-2');
      expect(selected?.tags).toContain('mysterious');
    });

    it('should respect weight in selection probability', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest'],
        segmentCount: 0,
        recentlyUsedIds: []
      };

      // Run multiple times to check weighted selection
      const selections: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        const selected = selector.selectContent(mockContent, criteria);
        if (selected) {
          selections[selected.id] = (selections[selected.id] || 0) + 1;
        }
      }

      // Higher weight content should be selected more often
      expect(selections['fantasy-forest-2']).toBeGreaterThan(selections['fantasy-forest-1'] || 0);
    });

    it('should exclude recently used content', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest'],
        segmentCount: 0,
        recentlyUsedIds: ['fantasy-forest-1']
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected?.id).not.toBe('fantasy-forest-1');
    });

    it('should respect content requirements', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest'],
        segmentCount: 1, // Not enough for combat content
        recentlyUsedIds: []
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected?.id).not.toBe('fantasy-combat-1');
    });

    it('should allow combat content when requirements are met', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['forest', 'combat'],
        segmentCount: 3, // Enough for combat
        recentlyUsedIds: ['fantasy-forest-1', 'fantasy-forest-2']
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected?.id).toBe('fantasy-combat-1');
    });

    it('should return null if no content matches', () => {
      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'horror',
        tags: [],
        segmentCount: 0,
        recentlyUsedIds: []
      };

      const selected = selector.selectContent(mockContent, criteria);
      
      expect(selected).toBeNull();
    });

    it('should handle exclude tags in requirements', () => {
      const contentWithExcludes: FallbackContent[] = [
        {
          id: 'outdoor-only',
          type: 'scene',
          themes: ['fantasy'],
          tags: ['nature'],
          content: 'Under the open sky...',
          requirements: { excludeTags: ['indoors'] }
        },
        {
          id: 'indoor-scene',
          type: 'scene',
          themes: ['fantasy'],
          tags: ['tavern'],
          content: 'Inside the cozy tavern...'
        }
      ];

      const criteria: ContentSelectionCriteria = {
        type: 'scene',
        theme: 'fantasy',
        tags: ['indoors', 'tavern'],
        segmentCount: 0,
        recentlyUsedIds: []
      };

      const selected = selector.selectContent(contentWithExcludes, criteria);
      
      expect(selected?.id).toBe('indoor-scene');
    });
  });

  describe('scoreContent', () => {
    it('should score content based on tag matches', () => {
      const content: FallbackContent = {
        id: 'test-1',
        type: 'scene',
        themes: ['fantasy'],
        tags: ['forest', 'day', 'peaceful'],
        content: 'Test content'
      };

      const score1 = selector.scoreContent(content, ['forest', 'day']);
      const score2 = selector.scoreContent(content, ['forest']);
      const score3 = selector.scoreContent(content, ['night']);

      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
    });
  });

  describe('meetsRequirements', () => {
    it('should validate include tags requirement', () => {
      const content: FallbackContent = {
        id: 'test-1',
        type: 'scene',
        themes: ['fantasy'],
        tags: [],
        content: 'Test',
        requirements: { includeTags: ['forest', 'day'] }
      };

      expect(selector.meetsRequirements(content, ['forest', 'day', 'peaceful'], 0)).toBe(true);
      expect(selector.meetsRequirements(content, ['forest'], 0)).toBe(false);
    });

    it('should validate segment count requirements', () => {
      const content: FallbackContent = {
        id: 'test-1',
        type: 'scene',
        themes: ['fantasy'],
        tags: [],
        content: 'Test',
        requirements: { minSegments: 3, maxSegments: 5 }
      };

      expect(selector.meetsRequirements(content, [], 2)).toBe(false);
      expect(selector.meetsRequirements(content, [], 4)).toBe(true);
      expect(selector.meetsRequirements(content, [], 6)).toBe(false);
    });
  });
});