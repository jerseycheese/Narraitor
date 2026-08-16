import { sceneTemplate } from '../sceneTemplate';
import type { NarrativeTemplateContext } from '../context';

function makeContext(turnsSinceComplication?: number): NarrativeTemplateContext {
  return {
    worldName: 'Butler County Outskirts',
    genre: 'zombie survival',
    tone: 'tense',
    playerCharacterName: 'Alex',
    narrativeContext: {
      recentSegments: [{ content: 'You crouch by the fence, watching the road.' }],
      currentSituation: 'Player chose: "Follow the trail cautiously"',
      currentTags: [],
      turnsSinceComplication,
    },
  };
}

describe('sceneTemplate pacing guidance', () => {
  it('omits pacing guidance when the streak is below the threshold', () => {
    expect(sceneTemplate(makeContext(2))).not.toContain('PACING GUIDANCE');
  });

  it('omits pacing guidance when no streak is tracked at all', () => {
    expect(sceneTemplate(makeContext(undefined))).not.toContain('PACING GUIDANCE');
  });

  it('tells the model to introduce a complication once the streak crosses the threshold', () => {
    const prompt = sceneTemplate(makeContext(3));
    expect(prompt).toContain('PACING GUIDANCE');
    expect(prompt).toContain('MUST introduce a complication');
    expect(prompt).toContain('3 turns in a row');
  });

  it('tells the model to record the forced complication as a majorEvent so the streak actually resets', () => {
    const prompt = sceneTemplate(makeContext(3));
    expect(prompt).toContain('counts as a major event');
    expect(prompt).toContain('metadata.majorEvent');
  });

  it('keeps escalating the guidance for longer streaks', () => {
    const prompt = sceneTemplate(makeContext(9));
    expect(prompt).toContain('9 turns in a row');
  });
});

describe('sceneTemplate player action handling', () => {
  const typedAction = 'I ask who benefits if the deed goes through';

  function makeTypedContext(
    overrides: Partial<NarrativeTemplateContext> = {}
  ): NarrativeTemplateContext {
    return {
      worldName: 'Millbrook',
      genre: 'small town drama',
      tone: 'grounded',
      playerCharacterName: 'Alex',
      playerCharacterBackground: {
        history: 'Your grandparents worked the looms at the Hendricks mill.',
        personality: 'Stubborn, slow to trust.',
      },
      narrativeContext: {
        recentSegments: [
          { content: 'Martha slides the ledger across the table.' },
        ],
        currentSituation: `Player chose: "${typedAction}"`,
        currentTags: [],
      },
      ...overrides,
    };
  }

  it('carries the typed action into the prompt verbatim', () => {
    expect(sceneTemplate(makeTypedContext())).toContain(typedAction);
  });

  it('requires the passage to engage with what the player did or said', () => {
    const prompt = sceneTemplate(makeTypedContext());
    expect(prompt).toContain('PLAYER ACTION REQUIREMENTS');
    expect(prompt).toMatch(/must visibly engage with the action above/i);
  });

  it('requires a direct question to be answered, dodged, or refused on the page', () => {
    const prompt = sceneTemplate(makeTypedContext());
    expect(prompt).toMatch(/asked a question/i);
    expect(prompt).toMatch(/answers it, dodges it, or refuses it/i);
  });

  it('tells the model to invent an answer when nothing established supplies one', () => {
    expect(sceneTemplate(makeTypedContext())).toMatch(
      /invent one that fits the world/i
    );
  });

  it("forbids reprinting an earlier passage as this turn's response", () => {
    expect(sceneTemplate(makeTypedContext())).toMatch(
      /do not reprint or paraphrase a passage from STORY SO FAR/i
    );
  });

  it('gives the model the character background so raised backstory is answerable', () => {
    const prompt = sceneTemplate(makeTypedContext());
    expect(prompt).toContain('PLAYER CHARACTER BACKGROUND');
    expect(prompt).toContain(
      'Your grandparents worked the looms at the Hendricks mill.'
    );
    expect(prompt).toContain('Stubborn, slow to trust.');
  });

  it('accepts a plain string background', () => {
    const prompt = sceneTemplate(
      makeTypedContext({ playerCharacterBackground: 'Raised above the mill.' })
    );
    expect(prompt).toContain('PLAYER CHARACTER BACKGROUND');
    expect(prompt).toContain('Raised above the mill.');
  });

  it('omits the background section when the character has no background', () => {
    const prompt = sceneTemplate(
      makeTypedContext({ playerCharacterBackground: undefined })
    );
    expect(prompt).not.toContain('PLAYER CHARACTER BACKGROUND');
  });

  it('omits the action requirements when there is no player action', () => {
    const prompt = sceneTemplate(
      makeTypedContext({
        narrativeContext: {
          recentSegments: [{ content: 'The mill sits quiet.' }],
          currentTags: [],
        },
      })
    );
    expect(prompt).not.toContain('PLAYER ACTION REQUIREMENTS');
  });
});
