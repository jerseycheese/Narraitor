import { formatNarrativeResponse } from '../narrativeGenerator.response';
import { parseNarrativeResponse } from '../narrativeGenerator.response.parse';
import { normalizeNarrativeContent } from '../narrativeGenerator.response.normalize';
import { getCarryForwardLocation } from '../narrativeGenerator.response.helpers';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeExtractedMetadata } from '../narrativeGenerator.response.types';
import type { NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn(),
  },
}));

describe('narrative response helpers', () => {
  it('parses JSON responses with metadata', () => {
    const response = {
      content: `\n\n\`\`\`json\n{"content":"Hello","type":"dialogue","metadata":{"location":"Town","mood":"tense","tags":["tag"],"characterIds":["npc-1"],"speakerId":"npc-1","itemsAcquired":[{"name":"Key","description":"Rusty","quantity":1,"acquisitionMethod":"loot"}],"characters":[{"id":"npc-1","name":"Bob"}],"majorEvent":"Big moment"}}\n\`\`\``,
    };

    const parsed = parseNarrativeResponse(response, 'scene');

    expect(parsed.actualContent).toBe('Hello');
    expect(parsed.segmentType).toBe('dialogue');
    expect(parsed.extractedMetadata.location).toBe('Town');
    expect(parsed.extractedMetadata.mood).toBe('tense');
    expect(parsed.extractedMetadata.characterIds).toEqual(['npc-1']);
    expect(parsed.extractedMetadata.itemsAcquired?.[0]?.name).toBe('Key');
  });

  it('normalizes character tokens without duplicating names', () => {
    const extractedMetadata: NarrativeExtractedMetadata = {
      characters: [{ id: 'npc-1', name: 'Jordan' }],
    };

    const normalized = normalizeNarrativeContent(
      'Jordan [npc-1] nods.',
      extractedMetadata
    );

    expect(normalized).toBe('Jordan nods.');
  });

  it('drops a bare HTML tag and a trailing meta-commentary paragraph', () => {
    const content = [
      'Councilman Davies clears his throat and taps his pen on the table again.',
      '<br/>',
      '**The narrative will continue from this point, where the townspeople are reacting to the lack of a formal appraisal.**',
    ].join('\n\n');

    const normalized = normalizeNarrativeContent(content, {});

    expect(normalized).toBe(
      'Councilman Davies clears his throat and taps his pen on the table again.'
    );
  });

  it('keeps the text on either side of a stripped tag apart', () => {
    const normalized = normalizeNarrativeContent(
      'The door swings shut.<br/>Rain starts against the <em>cracked</em> glass.',
      {}
    );

    expect(normalized).toBe(
      'The door swings shut.\nRain starts against the cracked glass.'
    );
  });

  it('keeps a bolded closing line that belongs to the scene', () => {
    const content = [
      'The lantern gutters out and the hall goes dark.',
      '**The mill bell rings once, and every head in the room turns.**',
    ].join('\n\n');

    const normalized = normalizeNarrativeContent(content, {});

    expect(normalized).toBe(content);
  });

  describe('a response with no location', () => {
    const noLocationResponse = {
      content: `\n\n\`\`\`json\n{"content":"You wait in the dark.","metadata":{"mood":"tense"}}\n\`\`\``,
    };

    const buildSegment = (location: string): NarrativeSegment => ({
      id: `segment-${location}`,
      content: 'Something happens.',
      type: 'scene',
      metadata: { tags: [], location },
      timestamp: new Date(),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    beforeEach(() => {
      // A genre is seeded so the fallback can't quietly come from the world
      // instead of from the story.
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: { 'world-1': { genre: 'Horror' } },
        currentWorldId: 'world-1',
      });
    });

    it('carries the last segment location forward', async () => {
      const previousLocation = getCarryForwardLocation({
        previousSegments: [],
        recentSegments: [buildSegment('Dock'), buildSegment('Boathouse interior')],
      });

      const result = await formatNarrativeResponse(
        noLocationResponse,
        'scene',
        { generateContent: jest.fn() },
        previousLocation
      );

      expect(result.metadata.location).toBe('Boathouse interior');
    });

    it('uses a neutral placeholder on the first segment', async () => {
      const result = await formatNarrativeResponse(noLocationResponse, 'scene', {
        generateContent: jest.fn(),
      });

      expect(result.metadata.location).toBe('Starting Location');
    });
  });

  it('preserves itemsLost metadata when formatting response', async () => {
    const response = {
      content: `\n\n\`\`\`json\n{"content":"You drop the knife.","metadata":{"itemsLost":[{"name":"Rusted Knife","lossReason":"dropped","quantity":1}]}}\n\`\`\``,
    };

    const geminiClient = {
      generateContent: jest.fn(),
    };

    const result = await formatNarrativeResponse(response, 'scene', geminiClient);

    expect(result.metadata.itemsLost).toEqual([
      { name: 'Rusted Knife', lossReason: 'dropped', quantity: 1 },
    ]);
  });
});
