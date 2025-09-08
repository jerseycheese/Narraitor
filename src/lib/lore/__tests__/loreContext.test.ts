import { buildLoreContext } from '../loreContext';
import type { LoreFact } from '../../../types/lore.types';

describe('buildLoreContext', () => {
  describe('Basic Functionality', () => {
    it('returns empty context for empty input', () => {
      const result = buildLoreContext([]);
      
      expect(result).toEqual({
        characters: [],
        locations: [],
        worldRules: [],
        historicalEvents: []
      });
    });

    it('handles invalid facts gracefully', () => {
      const invalidFacts = [
        { id: 'invalid1', key: 'unknown_fact', category: 'unknown' as 'characters', value: 'Invalid fact', source: 'manual' as const, worldId: 'world1', sessionId: 'session1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      
      const result = buildLoreContext(invalidFacts);
      
      expect(result).toEqual({
        characters: [],
        locations: [],
        worldRules: [],
        historicalEvents: []
      });
    });
  });

  describe('Character Processing', () => {
    it('processes character facts correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'char1',
          category: 'characters',
          key: 'world1:character_aragorn',
          value: 'Aragorn - skilled ranger and the rightful king of Gondor. He is brave and loyal.',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual({
        name: 'Aragorn',
        traits: ['brave', 'loyal', 'skilled'],
        background: 'skilled ranger and the rightful king of Gondor. He is brave and loyal.',
        importance: 'high'
      });
    });

    it('handles characters with minimal traits', () => {
      const facts: LoreFact[] = [
        {
          id: 'char2',
          category: 'characters',
          key: 'world1:character_legolas',
          value: 'Legolas - elf',
          source: 'narrative',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual({
        name: 'Legolas',
        traits: ['undefined'],
        background: 'elf',
        importance: 'medium'
      });
    });
  });

  describe('Location Processing', () => {
    it('processes location facts correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'loc1',
          category: 'locations',
          key: 'world1:location_rivendell',
          value: 'Rivendell - peaceful elven refuge hidden in the mountains',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]).toEqual({
        name: 'Rivendell',
        type: 'mountain',
        description: 'peaceful elven refuge hidden in the mountains',
        importance: 'high'
      });
    });

    it('handles locations with minimal description', () => {
      const facts: LoreFact[] = [
        {
          id: 'loc2',
          category: 'locations',
          key: 'world1:location_mordor',
          value: 'Mordor - dark',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]).toEqual({
        name: 'Mordor',
        type: 'location',
        description: 'dark',
        importance: 'high'
      });
    });
  });

  describe('World Rules Processing', () => {
    it('processes world rule facts correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'rule1',
          category: 'rules',
          key: 'world1:rule_magic',
          value: 'Magic requires great concentration and can drain the user\'s energy.',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.worldRules).toHaveLength(1);
      expect(result.worldRules[0]).toEqual({
        rule: 'Magic requires great concentration and can drain the user\'s energy.',
        description: 'Magic requires great concentration and can drain the user\'s energy.',
        importance: 'high'
      });
    });
  });

  describe('Historical Events Processing', () => {
    it('processes historical event facts correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'event1',
          category: 'events',
          key: 'world1:event_war_of_ring',
          value: 'The War of the Ring ended with the destruction of the One Ring.',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.historicalEvents).toHaveLength(1);
      expect(result.historicalEvents[0]).toEqual({
        event: 'The War of the Ring ended with the destruction of the One Ring.',
        description: 'The War of the Ring ended with the destruction of the One Ring.',
        importance: 'high'
      });
    });
  });

  describe('Mixed Categories', () => {
    it('processes multiple categories correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'char1',
          category: 'characters',
          key: 'world1:character_gandalf',
          value: 'Gandalf - wise wizard',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'loc1',
          category: 'locations',
          key: 'world1:location_hobbiton',
          value: 'Hobbiton - peaceful village',
          source: 'narrative',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rule1',
          category: 'rules',
          key: 'world1:rule_hobbits',
          value: 'Hobbits have natural resistance to corruption.',
          source: 'narrative',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.characters).toHaveLength(1);
      expect(result.locations).toHaveLength(1);
      expect(result.worldRules).toHaveLength(1);
      expect(result.historicalEvents).toHaveLength(0);
    });
  });

  describe('Importance Levels', () => {
    it('preserves importance levels correctly', () => {
      const facts: LoreFact[] = [
        {
          id: 'char1',
          category: 'characters',
          key: 'world1:character_high',
          value: 'High - importance character',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'char2',
          category: 'characters',
          key: 'world1:character_medium',
          value: 'Medium - importance character',
          source: 'narrative',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'char3',
          category: 'characters',
          key: 'world1:character_low',
          value: 'Low - importance character',
          source: 'manual',
          worldId: 'world1',
          sessionId: 'session1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const result = buildLoreContext(facts);

      expect(result.characters).toHaveLength(3);
      expect(result.characters.find(c => c.name === 'High')?.importance).toBe('high');
      expect(result.characters.find(c => c.name === 'Medium')?.importance).toBe('medium');
      expect(result.characters.find(c => c.name === 'Low')?.importance).toBe('high');
    });
  });
});