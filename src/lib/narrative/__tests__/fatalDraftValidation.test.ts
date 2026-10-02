import { isLethalNarrativeDraft } from '../fatalDraftValidation';
import type { NarrativeGenerationResult } from '@/types/narrative.types';

const makeDraft = (
  overrides: Partial<NarrativeGenerationResult> = {}
): NarrativeGenerationResult => ({
  content: 'The path winds through the dark woods.',
  segmentType: 'scene',
  metadata: {
    characterIds: [],
    tags: [],
  },
  ...overrides,
});

describe('isLethalNarrativeDraft', () => {
  it('returns true when metadata tags include fatal-outcome', () => {
    const draft = makeDraft({
      metadata: { characterIds: [], tags: ['fatal-outcome'] },
    });
    expect(isLethalNarrativeDraft(draft)).toBe(true);
  });

  it('returns true when segmentType is ending', () => {
    const draft = makeDraft();
    (draft as unknown as { segmentType: string }).segmentType = 'ending';
    expect(isLethalNarrativeDraft(draft)).toBe(true);
  });

  it('returns true when metadata carries endingId', () => {
    const draft = makeDraft({
      metadata: {
        characterIds: [],
        tags: [],
        endingId: 'ending-1',
      } as unknown as NarrativeGenerationResult['metadata'],
    });
    expect(isLethalNarrativeDraft(draft)).toBe(true);
  });

  it('returns true for second-person lethal prose patterns', () => {
    const lethalExamples = [
      'The blade pierces your chest, and you die in the mud.',
      'You are killed by the creature’s venomous bite.',
      'You breathe your last breath as the darkness consumes you.',
      'Death claims you before help can arrive.',
      'The beast slain you where you stand.',
      'You drop lifeless to the stone floor.',
      'You collapse and die from the poison.',
      'You succumb to the wounds and your vision fades to black.',
    ];

    for (const prose of lethalExamples) {
      expect(isLethalNarrativeDraft(makeDraft({ content: prose }))).toBe(true);
    }
  });

  it('returns true for named character lethal prose patterns', () => {
    const playerName = 'Elena';
    const lethalExamples = [
      'Elena dies as the poison stops her heart.',
      'Elena was fatally struck by the falling timber.',
      'Death took Elena before morning broke.',
      'Elena fell lifeless onto the frozen ground.',
      'Elena collapses dead amidst the ruins.',
    ];

    for (const prose of lethalExamples) {
      expect(
        isLethalNarrativeDraft(makeDraft({ content: prose }), playerName)
      ).toBe(true);
    }
  });

  it('returns false for survivable non-lethal setback prose', () => {
    const nonLethalExamples = [
      'The arrow grazes your shoulder, drawing blood, but you scramble behind cover.',
      'You stumble and fall, bruising your ribs, but manage to keep your grip on the torch.',
      'The wound burns fiercely, but you grit your teeth and press onward.',
      'Elena reels from the heavy impact, staggering back against the stone wall.',
      'You barely dodge the lethal swipe, your heart hammering against your ribs.',
    ];

    for (const prose of nonLethalExamples) {
      expect(
        isLethalNarrativeDraft(makeDraft({ content: prose }), 'Elena')
      ).toBe(false);
    }
  });

  it('returns false for empty or whitespace content', () => {
    expect(isLethalNarrativeDraft(makeDraft({ content: '' }))).toBe(false);
    expect(isLethalNarrativeDraft(makeDraft({ content: '   ' }))).toBe(false);
  });
});
