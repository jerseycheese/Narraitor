import { enforceLanguageComplexity } from '../narrativeGenerator.languageComplexity';
import { MockAIClient } from '../../__mocks__/mockAiClient';
import { logger } from '@/lib/utils/logger';
import type { NarrativeGenerationResult } from '@/types/narrative.types';
import type { ToneSettings } from '@/types/tone-settings.types';

const COMPLEXITY_WARNINGS = [
  'Language complexity rewrite did not pass thresholds',
  'Generated narrative exceeds language complexity guidelines',
];

const denseProse =
  'Calibrated luminescence surges through the labyrinthine conduits, illuminating iridescent glyphs with inexorable precision and unfathomable consequence.';

const baseResult = (content: string): NarrativeGenerationResult => ({
  content,
  segmentType: 'scene',
  metadata: {
    characterIds: ['character-1'],
    tags: [],
  },
});

describe('enforceLanguageComplexity logging', () => {
  let mockAiClient: MockAIClient;
  let debugSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAiClient = new MockAIClient();
    debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs at debug (not warn) and still self-heals when content and rewrite both exceed thresholds', async () => {
    // Rewrite attempt also returns dense prose, so both evaluations fail.
    mockAiClient.setMockResponses([{ content: denseProse }]);

    const toneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'dramatic',
      languageComplexity: 'simple',
    };

    const result = await enforceLanguageComplexity(
      baseResult(denseProse),
      toneSettings,
      mockAiClient
    );

    const warnMessages = warnSpy.mock.calls.map((call) => call[0]);
    COMPLEXITY_WARNINGS.forEach((message) => {
      expect(warnMessages).not.toContain(message);
    });

    const debugMessages = debugSpy.mock.calls.map((call) => call[0]);
    COMPLEXITY_WARNINGS.forEach((message) => {
      expect(debugMessages).toContain(message);
    });

    // Self-heal behavior is unchanged: original content kept, diagnostic tags added.
    expect(result.content).toBe(denseProse);
    expect(result.metadata.tags).toContain('language-complexity-review');
    expect(result.metadata.tags).toContain('language-complexity-simple');
  });
});
