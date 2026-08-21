import { extractGoalsFromNarrative } from '../goalExtractor';
import type { GoalExtractionRequest } from '../../../types/goal.types';
import { getTimestamp } from '@/lib/utils/timestamp';

const mockGenerateContent = jest.fn();
jest.mock('../defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({ generateContent: mockGenerateContent }),
}));

/** The narrative panel's ceiling, which the extraction used to inherit. */
const NARRATIVE_MAX_OUTPUT_TOKENS = 2048;

const buildRequest = (): GoalExtractionRequest => ({
  content: 'The magistrate rides for the capital and the ford is still out.',
  sessionId: 'session-1',
  segmentId: 'segment-1',
  existingGoals: [],
  worldThreads: {
    currentTurn: 27,
    openThreads: [
      {
        id: 'thread-abc',
        sessionId: 'session-1',
        worldId: 'world-1',
        kind: 'actor',
        summary: 'The magistrate is riding for the capital',
        openedAtTurn: 4,
        lastAdvancedAtTurn: 21,
        status: 'open',
        notes: [],
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
    ],
  },
});

const loggedText = (spy: jest.SpyInstance): string =>
  spy.mock.calls
    .flat()
    .filter((arg): arg is string => typeof arg === 'string')
    .join(' ');

describe('goalExtractor output budget and failure visibility', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGenerateContent.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('asks for more output room than a narrative beat gets', async () => {
    mockGenerateContent.mockResolvedValue({
      content: '```json\n{"newGoals":[],"updatedGoals":[],"completedGoals":[],"confidence":0.8}\n```',
      finishReason: 'STOP',
    });

    await extractGoalsFromNarrative(buildRequest());

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxTokens: expect.any(Number) })
    );
    const options = mockGenerateContent.mock.calls[0][1];
    expect(options.maxTokens).toBeGreaterThan(NARRATIVE_MAX_OUTPUT_TOKENS);
  });

  it('reports a response cut at the ceiling at error level, where production keeps it', async () => {
    mockGenerateContent.mockResolvedValue({
      content: '```json\n{\n  "newGoals": [\n    {\n      "title": "Reach the ford before',
      finishReason: 'MAX_TOKENS',
    });

    const result = await extractGoalsFromNarrative(buildRequest());

    expect(result.worldThreads).toBeUndefined();
    expect(loggedText(errorSpy)).toContain('truncated');
    const reported = errorSpy.mock.calls.flat().find((arg) => arg instanceof Error);
    expect((reported as Error).name).toBe('ExtractionTruncatedError');
  });

  it('names a prose answer as a parse failure, not a truncation', async () => {
    mockGenerateContent.mockResolvedValue({
      content: 'The magistrate reaches the capital by nightfall.',
      finishReason: 'STOP',
    });

    const result = await extractGoalsFromNarrative(buildRequest());

    expect(result.worldThreads).toBeUndefined();
    const logged = loggedText(warnSpy);
    expect(logged).toContain('No JSON block');
    expect(logged).not.toContain('truncated');
  });
});
