import { formatNarrativeResponse } from '../narrativeGenerator.response';
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
