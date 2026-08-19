import { buildWorldCostPromptSection, parseWorldCostExtraction } from '../worldCostExtraction';

describe('worldCostExtraction', () => {
  describe('buildWorldCostPromptSection', () => {
    it('lists what the character carries and what the scene recorded as lost', () => {
      const section = buildWorldCostPromptSection({
        conditions: ['gashed left forearm'],
        itemsLost: ['rusty shovel'],
      });

      expect(section).toContain('WORLD COST');
      expect(section).toContain('gashed left forearm');
      expect(section).toContain('rusty shovel');
      expect(section).toContain('"worldCost"');
    });

    it('says so when the character carries nothing and nothing was lost', () => {
      const section = buildWorldCostPromptSection({ conditions: [], itemsLost: [] });

      expect(section).toContain('(none)');
    });
  });

  describe('parseWorldCostExtraction', () => {
    it('reads imposed costs with their thread and the cleared conditions', () => {
      const result = parseWorldCostExtraction({
        imposed: [
          { kind: 'condition', detail: ' gashed left forearm ', threadId: 'thread-1' },
          { kind: 'item', detail: 'rusty shovel', threadId: null },
        ],
        cleared: ['shaken'],
      });

      expect(result).toEqual({
        imposed: [
          { kind: 'condition', detail: 'gashed left forearm', threadId: 'thread-1' },
          { kind: 'item', detail: 'rusty shovel' },
        ],
        cleared: ['shaken'],
      });
    });

    it('drops entries with an unknown kind or no detail and keeps the rest', () => {
      const result = parseWorldCostExtraction({
        imposed: [
          { kind: 'health', detail: '-10' },
          { kind: 'condition', detail: '' },
          { kind: 'condition', detail: 'discredited before the council' },
          'junk',
        ],
        cleared: ['', 42, 'shaken'],
      });

      expect(result).toEqual({
        imposed: [{ kind: 'condition', detail: 'discredited before the council' }],
        cleared: ['shaken'],
      });
    });

    it('returns undefined when the block is absent, so the caller can tell silence from nothing', () => {
      expect(parseWorldCostExtraction(undefined)).toBeUndefined();
      expect(parseWorldCostExtraction('nope')).toBeUndefined();
    });
  });
});
