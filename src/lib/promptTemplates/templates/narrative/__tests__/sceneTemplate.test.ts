import { sceneTemplate } from '../sceneTemplate';
import type { NarrativeTemplateContext } from '../context';

function makeContext(
  turnsSinceComplication?: number,
  currentTags: string[] = [],
  decisionWeight?: 'minor' | 'major' | 'critical'
): NarrativeTemplateContext {
  return {
    worldName: 'Butler County Outskirts',
    genre: 'zombie survival',
    tone: 'tense',
    playerCharacterName: 'Alex',
    narrativeContext: {
      recentSegments: [{ content: 'You crouch by the fence, watching the road.' }],
      currentSituation: 'Player chose: "Follow the trail cautiously"',
      currentTags,
      turnsSinceComplication,
    },
    ...(decisionWeight ? { generationParameters: { decisionWeight } } : {}),
  };
}

describe('sceneTemplate failed-attempt guidance', () => {
  const HEADER = 'FAILED ATTEMPT — THE WORLD STILL MOVES:';

  it('renders the failed-attempt block on a failed skill check', () => {
    const prompt = sceneTemplate(makeContext(undefined, ['skill-failure:skill-1']));
    expect(prompt).toContain(HEADER);
    expect(prompt).toContain('never render failure as the attempt simply not occurring');
  });

  it('co-renders the block with the critical-failure severity bullet', () => {
    const prompt = sceneTemplate(makeContext(undefined, ['skill-critical-failure:skill-1']));
    expect(prompt).toContain(HEADER);
    expect(prompt).toContain('CRITICAL FAILURE:');
  });

  it('omits the block on a successful check', () => {
    const prompt = sceneTemplate(makeContext(undefined, ['skill-success:skill-1']));
    expect(prompt).not.toContain('FAILED ATTEMPT');
    expect(prompt).toContain('The player SUCCEEDED at their action');
  });

  it('omits the block when no check was rolled', () => {
    expect(sceneTemplate(makeContext(undefined, []))).not.toContain('FAILED ATTEMPT');
  });

  it('co-renders with the fatal outcome block on a critical-weight failure', () => {
    const prompt = sceneTemplate(
      makeContext(undefined, ['skill-failure:skill-1'], 'critical')
    );
    expect(prompt).toContain(HEADER);
    expect(prompt).toContain('FATAL/INCAPACITATING OUTCOME:');
  });

  it('replaces the old consequences-and-setbacks bullet so it cannot compete', () => {
    const prompt = sceneTemplate(makeContext(undefined, ['skill-failure:skill-1']));
    expect(prompt).toContain('see FAILED ATTEMPT rules below');
    expect(prompt).not.toContain('show realistic consequences and setbacks');
  });
});

describe('sceneTemplate skill result derivation', () => {
  const SUCCESS_BULLET = 'The player SUCCEEDED at their action';

  it('gives a critical success the success guidance plus its own bullet', () => {
    const prompt = sceneTemplate(
      makeContext(undefined, ['skill-critical-success:skill-1'])
    );
    expect(prompt).toContain('SKILL CHECK RESULT GUIDANCE');
    expect(prompt).toContain(SUCCESS_BULLET);
    expect(prompt).toContain('CRITICAL SUCCESS:');
    expect(prompt).not.toContain('FAILED ATTEMPT');
  });

  it('renders both halves when one check succeeds and another fails', () => {
    const prompt = sceneTemplate(
      makeContext(undefined, ['skill-success:a', 'skill-failure:b'])
    );
    expect(prompt).toContain(SUCCESS_BULLET);
    expect(prompt).toContain('MIXED OUTCOME:');
    expect(prompt).toContain('FAILED ATTEMPT — THE WORLD STILL MOVES:');
  });

  it('keeps a plain success free of the mixed and critical bullets', () => {
    const prompt = sceneTemplate(makeContext(undefined, ['skill-success:skill-1']));
    expect(prompt).toContain(SUCCESS_BULLET);
    expect(prompt).not.toContain('MIXED OUTCOME:');
    expect(prompt).not.toContain('CRITICAL SUCCESS:');
  });
});

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

describe('sceneTemplate player character background', () => {
  const typedAction = 'I bring up my grandparents working the looms';

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

  it('still renders the player action line alongside the background section', () => {
    expect(sceneTemplate(makeTypedContext())).toContain(typedAction);
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

  it('renders the background even on a turn with no player action', () => {
    const prompt = sceneTemplate(
      makeTypedContext({
        narrativeContext: {
          recentSegments: [{ content: 'The mill sits quiet.' }],
          currentTags: [],
        },
      })
    );
    expect(prompt).toContain('PLAYER CHARACTER BACKGROUND');
    expect(prompt).not.toContain('PLAYER ACTION:');
  });
});
