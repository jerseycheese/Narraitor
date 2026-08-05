import {
  extractRepeatedPhrases,
  enhancePromptWithPhraseVariety,
  buildKnownNameTokens,
} from '../narrativeGenerator.phraseVariety';
import { NarrativeGenerator } from '../narrativeGenerator';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { MockAIClient } from '../../__mocks__/mockAiClient';
import type { NarrativeSegment } from '@/types/narrative.types';

const segment = (content: string): NarrativeSegment => ({
  id: 'seg',
  content,
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('extractRepeatedPhrases', () => {
  it('returns words that reappear across recent segments', () => {
    const segments = [
      segment('The rifle felt cold metal against your palm.'),
      segment('You push through the dense woods, rifle ready.'),
      segment('The cold metal grip is a reassuring weight now.'),
    ];

    const result = extractRepeatedPhrases(segments);

    expect(result).toContain('rifle');
    expect(result).toContain('cold');
    expect(result).toContain('metal');
  });

  it('ignores words that only appear once', () => {
    const segments = [
      segment('The rifle felt cold metal against your palm.'),
      segment('You push through the dense woods.'),
    ];

    const result = extractRepeatedPhrases(segments);

    expect(result).not.toContain('woods');
    expect(result).not.toContain('palm');
  });

  it('returns an empty list when there are no segments', () => {
    expect(extractRepeatedPhrases([])).toEqual([]);
    expect(extractRepeatedPhrases(undefined)).toEqual([]);
  });

  it('caps the result to a small number of words', () => {
    const filler = Array.from({ length: 12 }, (_, i) => `distinctive${i}`).join(' ');
    const segments = [segment(filler), segment(filler)];

    const result = extractRepeatedPhrases(segments);

    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('never flags a repeated word that belongs to a known entity name', () => {
    const segments = [
      segment('Mara Chen pushes through the dense woods, rifle ready.'),
      segment('Mara Chen finds cold metal debris near the dense woods.'),
    ];
    const knownNameTokens = buildKnownNameTokens(['Mara Chen']);

    const result = extractRepeatedPhrases(segments, knownNameTokens);

    expect(result).not.toContain('mara');
    expect(result).not.toContain('chen');
    // Non-name repeats are still flagged.
    expect(result).toContain('woods');
  });
});

describe('buildKnownNameTokens', () => {
  it('lowercases and splits multi-word names into individual tokens', () => {
    const tokens = buildKnownNameTokens(['Mara Chen', 'Rustwater Camp', null, undefined]);

    expect(tokens.has('mara')).toBe(true);
    expect(tokens.has('chen')).toBe(true);
    expect(tokens.has('rustwater')).toBe(true);
    expect(tokens.has('camp')).toBe(true);
  });
});

describe('enhancePromptWithPhraseVariety', () => {
  it('appends a "find another angle" list when words repeat', () => {
    const segments = [
      segment('The rifle felt cold metal against your palm.'),
      segment('The cold metal grip is a reassuring weight now.'),
    ];

    const result = enhancePromptWithPhraseVariety('BASE PROMPT', segments);

    expect(result).toContain('BASE PROMPT');
    expect(result).toContain('cold');
    expect(result).toContain('metal');
  });

  it('returns the prompt unchanged when there is nothing to flag', () => {
    const result = enhancePromptWithPhraseVariety('BASE PROMPT', []);
    expect(result).toBe('BASE PROMPT');
  });

  it('returns the prompt unchanged when recentSegments is undefined', () => {
    const result = enhancePromptWithPhraseVariety('BASE PROMPT', undefined);
    expect(result).toBe('BASE PROMPT');
  });

  it('excludes known entity names from the flagged list', () => {
    const segments = [
      segment('Mara Chen pushes through the dense woods, rifle ready.'),
      segment('Mara Chen finds cold metal debris near the dense woods.'),
    ];
    const knownNameTokens = buildKnownNameTokens(['Mara Chen']);

    const result = enhancePromptWithPhraseVariety('BASE PROMPT', segments, knownNameTokens);

    expect(result).not.toContain('mara');
    expect(result).not.toContain('chen');
    expect(result).toContain('woods');
  });
});

describe('NarrativeGenerator phrase-variety integration', () => {
  let generator: NarrativeGenerator;
  let mockAiClient: MockAIClient;
  let worldId: string;

  beforeEach(() => {
    useWorldStore.getState().reset();
    mockAiClient = new MockAIClient();
    generator = new NarrativeGenerator(mockAiClient);

    worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'horror',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100,
      },
    });
  });

  it('flags words reused across recent segments in the generation prompt', async () => {
    mockAiClient.setMockResponse({ content: 'Generated narrative content' });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
      narrativeContext: {
        worldId,
        currentSceneId: 'scene-1',
        characterIds: ['test-character'],
        sessionId: 'test-session',
        previousSegments: [],
        currentTags: [],
        recentSegments: [
          segment('The rifle felt cold metal against your palm.'),
          segment('The cold metal grip is a reassuring weight now.'),
        ],
      },
    });

    const prompt = mockAiClient.getPrompts()[0];
    expect(prompt).toContain('RECENTLY OVERUSED WORDS');
    expect(prompt).toContain('cold');
    expect(prompt).toContain('metal');
  });

  it('does not add the overused-words section on a fresh session', async () => {
    mockAiClient.setMockResponse({ content: 'Generated narrative content' });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
    });

    const prompt = mockAiClient.getPrompts()[0];
    expect(prompt).not.toContain('RECENTLY OVERUSED WORDS');
  });

  it('does not flag an NPC name mentioned twice in recent segments', async () => {
    useNPCStore.getState().createNPC({
      worldId,
      name: 'Mara',
      description: 'A fellow survivor',
    });
    mockAiClient.setMockResponse({ content: 'Generated narrative content' });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
      narrativeContext: {
        worldId,
        currentSceneId: 'scene-1',
        characterIds: ['test-character'],
        sessionId: 'test-session',
        previousSegments: [],
        currentTags: [],
        recentSegments: [
          segment('Mara leads you through the dense woods, rifle ready.'),
          segment('Mara finds cold metal debris near the dense woods.'),
        ],
      },
    });

    const prompt = mockAiClient.getPrompts()[0];
    // Other repeated words still get flagged — only the NPC's name is excluded.
    expect(prompt).toContain('RECENTLY OVERUSED WORDS');
    const [, flaggedWordsLine] =
      prompt.match(/RECENTLY OVERUSED WORDS[^\n]*\n([^\n]*)/i) ?? [];
    expect(flaggedWordsLine).toBeDefined();
    expect(flaggedWordsLine?.toLowerCase()).not.toContain('mara');
  });
});
