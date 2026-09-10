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

    it('keeps causedByDecision: true only on literal true, dropping non-boolean or missing', () => {
      const result = parseWorldCostExtraction({
        imposed: [
          { kind: 'condition', detail: 'twisted ankle', causedByDecision: true },
          { kind: 'item', detail: 'rusty shovel', causedByDecision: 'true' },
          { kind: 'item', detail: 'torn backpack', causedByDecision: 1 },
          { kind: 'item', detail: 'pocket knife', causedByDecision: false },
          { kind: 'item', detail: 'compass' },
        ],
        cleared: [],
      });

      expect(result?.imposed).toEqual([
        { kind: 'condition', detail: 'twisted ankle', causedByDecision: true },
        { kind: 'item', detail: 'rusty shovel' },
        { kind: 'item', detail: 'torn backpack' },
        { kind: 'item', detail: 'pocket knife' },
        { kind: 'item', detail: 'compass' },
      ]);
    });
  });

  describe('DECISION_ATTRIBUTED_WORLD_COSTS flag', () => {
    const originalEnv = process.env.NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS;
      } else {
        process.env.NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS = originalEnv;
      }
    });

    it('produces byte-identical prompt when the flag is off', () => {
      process.env.NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS = 'false';
      const input = {
        conditions: ['gashed left forearm'],
        itemsLost: ['rusty shovel'],
        decision: { id: 'dec-1', text: 'Confront the creature', outcome: 'mixed' },
      };
      const sectionWithDecision = buildWorldCostPromptSection(input);
      const baselineSection = `WORLD COST (what the world took from the character this turn)
Conditions the character already carries:
- gashed left forearm
Items the scene recorded as lost this turn:
- rusty shovel

A cost is something the character lost or now carries that they did not choose to spend: a lasting state (kind "condition"), or an item taken, broken or destroyed by someone or something else (kind "item"). The player using, spending, bracing with or giving away an item is not a cost. A failed action whose prose leaves a lasting mark on the character (discredited before the room, a bleeding hand) is a cost.
- A condition is a lasting state the character will still have next scene, named as what is wrong with them ("gashed left forearm", "discredited before the council", "no longer welcome at the Hendersons'"). It is never a feeling, a sensation, a sound they made, a pressure they are under, or an event that happened to them. "cold dread", "urgency", "a desperate sound tearing at the throat" are not conditions.
- IMPOSE at most ONE new condition per turn: the single most lasting thing the prose states. A blow to the arm that also dizzies and nauseates them is one condition, the arm. Items are not capped.
- Do not impose a condition already on the list above, under the same or new wording. If a listed condition got worse, CLEAR its text and IMPOSE the new one, once.
- Death, dying, unconsciousness and their kin are never conditions. If the prose killed the character or left them unable to act, set "fatal" to true and impose nothing for it.
- "detail" is a short noun phrase in the character's terms, not a sentence. If an open thread from the WORLD CLOCK LEDGER imposed it, set "threadId" to that thread's id; otherwise null.
- CLEAR a condition from the list above only when this segment's prose plainly ends it (the wound is bound, the room warms to the character again). Copy its text exactly.
- "fatal" is true only when this segment's prose plainly killed the character or left them unable to act in the story: dead, dying past saving, unconscious with no way back in this scene. Wounded, cornered, captured, or awake and able to act is false.
- Do not invent a cost the prose does not state. Most turns impose nothing and are not fatal; an empty list and false are the right answer then.
Return it under the "worldCost" key of the JSON below.`;
      expect(sectionWithDecision).toBe(baselineSection);
    });

    it('formats decision info and rule when the flag is on', () => {
      process.env.NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS = 'true';
      const input = {
        conditions: ['gashed left forearm'],
        itemsLost: ['rusty shovel'],
        decision: { id: 'dec-1', text: 'Confront the creature', outcome: 'mixed' },
      };
      const section = buildWorldCostPromptSection(input);
      expect(section).toContain("Player's chosen decision:\nConfront the creature (outcome: mixed)");
      expect(section).toContain('- If a cost was directly caused by the player\'s chosen decision above, set "causedByDecision" to true on that cost entry; otherwise false.');
    });
  });
});
