import { safeParseNarrativeAnalysis } from '../parseNarrativeResponse';

describe('safeParseNarrativeAnalysis', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('parses a well-formed payload', () => {
    const raw = JSON.stringify({
      suggestEnding: true,
      confidence: 'high',
      endingType: 'story-complete',
      reason: 'The arc has resolved.',
    });
    expect(safeParseNarrativeAnalysis(raw)).toEqual({
      suggestEnding: true,
      confidence: 'high',
      endingType: 'story-complete',
      reason: 'The arc has resolved.',
    });
  });

  it('strips ```json markdown fences', () => {
    const raw = '```json\n{"suggestEnding":false,"confidence":"low","endingType":"none","reason":"Not yet."}\n```';
    const parsed = safeParseNarrativeAnalysis(raw);
    expect(parsed?.suggestEnding).toBe(false);
    expect(parsed?.endingType).toBe('story-complete'); // "none" falls back to default
  });

  it('strips bare ``` fences', () => {
    const raw = '```\n{"suggestEnding":true,"confidence":"medium","endingType":"character-retirement","reason":"x"}\n```';
    const parsed = safeParseNarrativeAnalysis(raw);
    expect(parsed?.endingType).toBe('character-retirement');
  });

  it('returns null on malformed JSON', () => {
    expect(safeParseNarrativeAnalysis('{not json')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns null when required fields are missing', () => {
    expect(
      safeParseNarrativeAnalysis(JSON.stringify({ suggestEnding: 'yes' }))
    ).toBeNull();
    expect(
      safeParseNarrativeAnalysis(
        JSON.stringify({ suggestEnding: true, confidence: 'maybe', reason: 'x' })
      )
    ).toBeNull();
  });

  it('defaults endingType to story-complete when unrecognised', () => {
    const raw = JSON.stringify({
      suggestEnding: true,
      confidence: 'high',
      endingType: 'totally-made-up',
      reason: 'x',
    });
    expect(safeParseNarrativeAnalysis(raw)?.endingType).toBe('story-complete');
  });
});
