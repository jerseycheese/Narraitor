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

    it('states the condition rule: lasting states only, one per turn, death is fatal not a condition', () => {
      const section = buildWorldCostPromptSection({ conditions: [], itemsLost: [] });

      expect(section).toContain('lasting state the character will still have next scene');
      expect(section).toContain('never a feeling, a sensation, a sound they made');
      expect(section).toContain('at most ONE new condition per turn');
      expect(section).toContain('CLEAR its text and IMPOSE the new one, once');
      expect(section).toContain('Death, dying, unconsciousness and their kin are never conditions');
      expect(section).toContain('set "fatal" to true');
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
        fatal: false,
      });
    });

    it('keeps one condition per turn and every item, so a fan-out of symptoms lands as one', () => {
      const result = parseWorldCostExtraction({
        imposed: [
          { kind: 'condition', detail: 'nausea' },
          { kind: 'item', detail: 'the decision document' },
          { kind: 'condition', detail: 'swimming vision' },
          { kind: 'condition', detail: 'stinging eyes' },
          { kind: 'item', detail: 'the brass key' },
        ],
        cleared: [],
      });

      expect(result?.imposed).toEqual([
        { kind: 'condition', detail: 'nausea' },
        { kind: 'item', detail: 'the decision document' },
        { kind: 'item', detail: 'the brass key' },
      ]);
    });

    it('reads fatal only when the model said true', () => {
      expect(parseWorldCostExtraction({ imposed: [], cleared: [], fatal: true })?.fatal).toBe(true);
      expect(parseWorldCostExtraction({ imposed: [], cleared: [], fatal: 'true' })?.fatal).toBe(false);
      expect(parseWorldCostExtraction({ imposed: [], cleared: [] })?.fatal).toBe(false);
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
        fatal: false,
      });
    });

    it('returns undefined when the block is absent, so the caller can tell silence from nothing', () => {
      expect(parseWorldCostExtraction(undefined)).toBeUndefined();
      expect(parseWorldCostExtraction('nope')).toBeUndefined();
    });
  });
});
