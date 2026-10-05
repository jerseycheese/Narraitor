import { getChapterContext } from '../chapters';
import { isSessionEndingSegment } from '../isSessionEndingSegment';
import type { NarrativeSegment } from '@/types/narrative.types';

const segment = (
  index: number,
  chapter?: NarrativeSegment['metadata']['chapter']
): NarrativeSegment => ({
  id: `segment-${index}`,
  sessionId: 'session-1',
  content: `Beat ${index}`,
  type: chapter ? 'ending' : 'scene',
  metadata: { tags: [], ...(chapter ? { chapter } : {}) },
  timestamp: new Date(index * 1000),
  createdAt: new Date(index * 1000).toISOString(),
  updatedAt: new Date(index * 1000).toISOString(),
});

const originalFlag = process.env.NEXT_PUBLIC_FEATURE_CHAPTERS;
afterEach(() => {
  if (originalFlag === undefined)
    delete process.env.NEXT_PUBLIC_FEATURE_CHAPTERS;
  else process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = originalFlag;
});

it('closes turn ten, opens chapter two from its recap, and resets the chapter turn count', () => {
  const firstChapter = Array.from({ length: 9 }, (_, index) => segment(index));
  expect(getChapterContext(firstChapter)).toMatchObject({
    number: 1,
    isEnding: true,
  });
  const boundary = segment(9, {
    number: 1,
    recap: 'Previously: A bridge fell.',
  });
  const next = getChapterContext([...firstChapter, boundary]);
  expect(next).toMatchObject({
    number: 2,
    isOpening: true,
    isEnding: false,
    recap: boundary.metadata.chapter?.recap,
  });
  expect(next.recentSegments).toEqual([]);
  expect(
    getChapterContext([
      ...firstChapter,
      boundary,
      ...Array.from({ length: 9 }, (_, index) => segment(index + 10)),
    ])
  ).toMatchObject({ number: 2, isEnding: true });
});

it('keeps chapter endings playable only with the flag on and never suppresses death', () => {
  const boundary = segment(10, { number: 1 });
  process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'false';
  expect(isSessionEndingSegment(boundary)).toBe(true);
  process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'true';
  expect(isSessionEndingSegment(boundary)).toBe(false);
  boundary.metadata.tags = ['fatal-outcome'];
  expect(isSessionEndingSegment(boundary)).toBe(true);
});
