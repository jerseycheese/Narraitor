import { generateConsistencyInstructions } from '../consistencyInstructions';
import type { ConsistencyLoreContext } from '../../../types/lore.types';

describe('generateConsistencyInstructions', () => {
  describe('Empty Context', () => {
    it('returns default consistency instructions for empty context', () => {
      const emptyContext: ConsistencyLoreContext = {
        characters: [],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(emptyContext);
      
      expect(result).toContain('NARRATIVE CONSISTENCY REQUIREMENTS:');
      expect(result).toContain('You must maintain strict consistency with the following established lore:');
      expect(result).toContain('CRITICAL: Never contradict the above established lore.');
      expect(result).not.toContain('CHARACTER CONSISTENCY:');
      expect(result).not.toContain('LOCATION CONSISTENCY:');
      expect(result).not.toContain('WORLD RULES - NEVER CONTRADICT:');
      expect(result).not.toContain('HISTORICAL EVENTS - MAINTAIN TIMELINE:');
    });
  });

  describe('Character Instructions', () => {
    it('generates instructions for characters with different importance levels', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'Aragorn',
            traits: ['skilled ranger', 'rightful king', 'brave'],
            background: 'Ranger of the North who becomes king',
            importance: 'high'
          },
          {
            name: 'Tom',
            traits: ['innkeeper'],
            background: 'Local innkeeper at the Prancing Pony',
            importance: 'low'
          }
        ],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('CHARACTER CONSISTENCY:');
      expect(result).toContain('Aragorn: Always portray as skilled ranger, rightful king, brave');
      expect(result).toContain('Tom: Always portray as innkeeper');
    });

    it('handles only high importance characters', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'Gandalf',
            traits: ['wizard', 'wise'],
            background: 'Gray Wizard of Middle-earth',
            importance: 'high'
          }
        ],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('CHARACTER CONSISTENCY:');
      expect(result).toContain('Gandalf: Always portray as wizard, wise');
    });

    it('handles only medium/low importance characters', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'Villager',
            traits: ['farmer'],
            background: 'A simple farmer who works the fields',
            importance: 'medium'
          }
        ],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('CHARACTER CONSISTENCY:');
      expect(result).toContain('Villager: Always portray as farmer');
    });
  });

  describe('Location Instructions', () => {
    it('generates instructions for locations with different importance levels', () => {
      const context: ConsistencyLoreContext = {
        characters: [],
        locations: [
          {
            name: 'Rivendell',
            type: 'elven refuge',
            description: 'peaceful hidden sanctuary',
            importance: 'high'
          },
          {
            name: 'Small Village',
            type: 'settlement',
            description: 'quiet farming community',
            importance: 'low'
          }
        ],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('LOCATION CONSISTENCY:');
      expect(result).toContain('Rivendell: Must always be described as peaceful hidden sanctuary');
      expect(result).toContain('Small Village: Must always be described as quiet farming community');
    });
  });

  describe('World Rules Instructions', () => {
    it('generates instructions for world rules with different importance levels', () => {
      const context: ConsistencyLoreContext = {
        characters: [],
        locations: [],
        worldRules: [
          {
            rule: 'Magic requires great concentration and drains energy',
            description: 'Fundamental rule about how magic works in this world',
            importance: 'high'
          },
          {
            rule: 'Shops close at sunset',
            description: 'Basic commerce timing rule for settlements',
            importance: 'low'
          }
        ],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('WORLD RULES - NEVER CONTRADICT:');
      expect(result).toContain('Magic requires great concentration and drains energy');
      expect(result).toContain('Shops close at sunset');
    });
  });

  describe('Historical Events Instructions', () => {
    it('generates instructions for historical events with different importance levels', () => {
      const context: ConsistencyLoreContext = {
        characters: [],
        locations: [],
        worldRules: [],
        historicalEvents: [
          {
            event: 'The Great War reshaped the entire realm',
            description: 'The Great War reshaped the entire realm',
            importance: 'high'
          },
          {
            event: 'Local harvest festival happens annually',
            description: 'Local harvest festival happens annually',
            importance: 'medium'
          }
        ]
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('HISTORICAL EVENTS - MAINTAIN TIMELINE:');
      expect(result).toContain('The Great War reshaped the entire realm');
      expect(result).toContain('Local harvest festival happens annually');
    });
  });

  describe('Complete Context', () => {
    it('generates comprehensive instructions for all categories', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'Hero',
            traits: ['brave', 'determined'],
            background: 'The chosen champion destined to save the realm',
            importance: 'high'
          }
        ],
        locations: [
          {
            name: 'Capital',
            type: 'city',
            description: 'grand metropolis',
            importance: 'high'
          }
        ],
        worldRules: [
          {
            rule: 'Magic is forbidden in the city',
            description: 'Strict law prohibiting magical practice within city limits',
            importance: 'high'
          }
        ],
        historicalEvents: [
          {
            event: 'The Magic War ended 100 years ago',
            description: 'The Magic War ended 100 years ago',
            importance: 'high'
          }
        ]
      };

      const result = generateConsistencyInstructions(context);

      expect(result).toContain('CHARACTER CONSISTENCY:');
      expect(result).toContain('Hero: Always portray as brave, determined');
      expect(result).toContain('LOCATION CONSISTENCY:');
      expect(result).toContain('Capital: Must always be described as grand metropolis');
      expect(result).toContain('WORLD RULES - NEVER CONTRADICT:');
      expect(result).toContain('Magic is forbidden in the city');
      expect(result).toContain('HISTORICAL EVENTS - MAINTAIN TIMELINE:');
      expect(result).toContain('The Magic War ended 100 years ago');
    });

    it('formats instructions with proper spacing and structure', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'TestChar',
            traits: ['trait1'],
            background: 'Test character background',
            importance: 'high'
          }
        ],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      // Should have proper section headers and spacing
      expect(result).toMatch(/CHARACTER CONSISTENCY:.*\n.*TestChar/);
      expect(result.trim()).not.toBe('');
      expect(result).not.toContain('undefined');
    });
  });

  describe('Edge Cases', () => {
    it('handles characters with no traits', () => {
      const context: ConsistencyLoreContext = {
        characters: [
          {
            name: 'NoTraits',
            traits: [],
            background: 'A mysterious character with no defined traits',
            importance: 'medium'
          }
        ],
        locations: [],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      // Character with empty traits should still be included
      expect(result).toContain('NoTraits');
      expect(result).not.toContain('undefined');
    });

    it('handles locations with empty descriptions', () => {
      const context: ConsistencyLoreContext = {
        characters: [],
        locations: [
          {
            name: 'EmptyDesc',
            type: 'place',
            description: '',
            importance: 'medium'
          }
        ],
        worldRules: [],
        historicalEvents: []
      };

      const result = generateConsistencyInstructions(context);

      // Should not include location with empty description
      expect(result).not.toContain('EmptyDesc');
      expect(result).not.toContain('undefined');
    });
  });
});