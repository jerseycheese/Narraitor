/**
 * addSegment is the one place a generated scene becomes a stored passage, so
 * the sanitization and dedupe gate sits there rather than on each caller.
 */

import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';

describe('addSegment content gate', () => {
  let worldId: string;
  const sessionId = 'session-content-gate-test';

  const openingParagraph =
    'The bell over the door rang twice before Mira realised nobody had opened it, and she stood very still against the sound of her own breathing.';

  beforeEach(() => {
    jest.useRealTimers();
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    global.fetch = jest.fn();

    worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });
    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId: 'char-test',
      status: 'active',
      lastActivity: new Date().toISOString(),
    });
  });

  afterEach(() => {
    useNarrativeStore.getState().reset();
    useWorldStore.getState().reset();
    jest.restoreAllMocks();
  });

  const addSegment = (content: string): string =>
    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content,
      type: 'scene',
      metadata: { tags: [] },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

  const storedContent = (segmentId: string): string =>
    useNarrativeStore.getState().segments[segmentId].content;

  it('stores the passage without the bookkeeping the generator wrapped it in', () => {
    const segmentId = addSegment(
      [
        openingParagraph,
        '',
        '<details open><summary>World Clock</summary>',
        '- (deadline, open 4 turns) The magistrate arrives at dusk.',
        '</details>',
        '',
        '**Player Status:**',
        '- Wounded (left arm)',
      ].join('\n')
    );

    expect(storedContent(segmentId)).toBe(openingParagraph);
  });

  it('trims a paragraph already shown in a recent segment', () => {
    addSegment(openingParagraph);

    const segmentId = addSegment(
      `${openingParagraph}\n\nShe went to the window instead, and did not like what she saw there.`
    );

    expect(storedContent(segmentId)).toBe(
      'She went to the window instead, and did not like what she saw there.'
    );
  });

  it('leaves an ordinary new passage untouched', () => {
    addSegment(openingParagraph);
    const fresh =
      'Mira closed the ledger, took Albright by the sleeve, and walked him out into a street that had emptied while they argued.';

    expect(storedContent(addSegment(fresh))).toBe(fresh);
  });
});
