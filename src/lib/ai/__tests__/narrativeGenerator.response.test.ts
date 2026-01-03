import { parseNarrativeResponse } from '../narrativeGenerator.response.parse';
import { normalizeNarrativeContent } from '../narrativeGenerator.response.normalize';
import type { NarrativeExtractedMetadata } from '../narrativeGenerator.response.types';

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
});
