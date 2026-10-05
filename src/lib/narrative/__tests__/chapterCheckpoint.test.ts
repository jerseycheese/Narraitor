import { useInventoryStore } from '@/state/inventoryStore';
import { createChapterCheckpoint } from '../chapterCheckpoint';
import { useNarrativeStore } from '@/state/narrativeStore';
import { aiFetch } from '@/lib/ai/aiFetch';
import { fallbackChapterRecap } from '@/lib/narrative/chapters';
import type { NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/lib/ai/aiFetch', () => ({ aiFetch: jest.fn() }));
const mockFetch = jest.mocked(aiFetch);
const boundary: NarrativeSegment = {
  id: 'boundary',
  sessionId: 'session-1',
  worldId: 'world-1',
  type: 'ending',
  content: 'You reach the gate with the seal.',
  timestamp: new Date('2026-01-01'),
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  metadata: { tags: [], location: 'Gate', chapter: { number: 1 } },
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'true';
  useNarrativeStore.setState({
    segments: { boundary },
    sessionSegments: { 'session-1': ['boundary'] },
    endedSessions: {},
    currentEnding: null,
  });
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_FEATURE_CHAPTERS;
});

it('shares one request across callers, persists the recap, and leaves the session playable', async () => {
  const recap = fallbackChapterRecap({
    worldId: 'world-1',
    sessionId: 'session-1',
    events: [],
    currentLocation: 'Gate',
  });
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ chapterRecap: recap }),
  } as Response);
  await Promise.all([
    createChapterCheckpoint(boundary, 'character-1'),
    createChapterCheckpoint(boundary, 'character-1'),
  ]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(
    useNarrativeStore.getState().segments.boundary.metadata.chapter?.recap
  ).toBe(recap);
  expect(useNarrativeStore.getState().isSessionEnded('session-1')).toBe(false);
  expect(useNarrativeStore.getState().currentEnding).toBeNull();
  await createChapterCheckpoint(boundary, 'character-1');
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it('falls back on failure or interrupted persisted attempts without repeated generation', async () => {
  mockFetch.mockRejectedValue(new Error('Provider unavailable'));
  await createChapterCheckpoint(boundary);
  expect(
    useNarrativeStore.getState().segments.boundary.metadata.chapter?.recap
  ).toContain('Where it stopped: Gate');
  useNarrativeStore
    .getState()
    .updateSegment('boundary', {
      metadata: {
        ...boundary.metadata,
        chapter: { number: 1, recapRequested: true },
      },
    });
  await createChapterCheckpoint(boundary);
  expect(mockFetch).toHaveBeenCalledTimes(1);
});


it('waits for inventory hydration before spending its only recap request', async () => {
  let finishHydration!: () => void;
  const hydration = new Promise<void>(resolve => { finishHydration = resolve; });
  const hydrationState = jest.spyOn(useInventoryStore.persist, 'hasHydrated').mockReturnValue(false);
  const rehydrate = jest.spyOn(useInventoryStore.persist, 'rehydrate').mockReturnValue(hydration);
  mockFetch.mockResolvedValue({ ok: false } as Response);
  const pending = createChapterCheckpoint(boundary);
  await Promise.resolve();
  expect(mockFetch).not.toHaveBeenCalled();
  finishHydration();
  await pending;
  expect(mockFetch).toHaveBeenCalledTimes(1);
  hydrationState.mockRestore();
  rehydrate.mockRestore();
});

it("includes this chapter's selected decisions without needing narrativeSegmentId", async () => {
  useNarrativeStore.setState({
    decisions: {
      early: { id: 'early', prompt: 'Old', options: [], selectedAt: new Date('2025-12-01') },
      late: {
        id: 'late',
        prompt: 'Open the gate?',
        options: [{ id: 'o1', text: 'Open it' }],
        selectedOptionId: 'o1',
        selectedAt: new Date('2026-01-02'),
      },
    },
    sessionDecisions: { 'session-1': ['early', 'late'] },
  });
  mockFetch.mockResolvedValue({ ok: false } as Response);
  await createChapterCheckpoint(boundary, 'character-1');
  const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
  expect(body.decisions).toEqual([{ id: 'late', text: 'Open it' }]);
});
