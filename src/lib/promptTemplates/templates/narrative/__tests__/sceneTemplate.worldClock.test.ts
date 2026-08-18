import { sceneTemplate } from '../sceneTemplate';
import type { NarrativeTemplateContext } from '../context';
import type { WorldClockPromptContext } from '@/types/worldThread.types';

const WORLD_CLOCK_HEADER = 'WORLD CLOCK - THE WORLD MOVES WITHOUT THE PLAYER:';
const PACING_HEADER = 'PACING GUIDANCE — RISING TENSION:';

function makeContext(
  worldClock?: WorldClockPromptContext,
  turnsSinceComplication = 0
): NarrativeTemplateContext {
  return {
    worldName: 'Harrowgate Mills',
    genre: 'civic drama',
    tone: 'tense',
    playerCharacterName: 'Wren',
    narrativeContext: {
      recentSegments: [{ content: 'The council room is quiet.' }],
      currentSituation: 'Player chose: "Wait for the meeting to open"',
      currentTags: [],
      turnsSinceComplication,
      worldClock,
    },
  };
}

describe('sceneTemplate world clock block', () => {
  it('renders nothing about the clock when the context has no worldClock', () => {
    const prompt = sceneTemplate(makeContext(undefined));
    expect(prompt).not.toContain(WORLD_CLOCK_HEADER);
  });

  it('renders the ledger with age, overdue marks and the spend rule', () => {
    const prompt = sceneTemplate(
      makeContext({
        currentTurn: 12,
        turnsSinceWorldMoved: 3,
        threads: [
          {
            kind: 'deadline',
            summary: 'The council vote is in six weeks',
            ageTurns: 11,
            overdue: false,
            overdueByTurns: 0,
            dueNow: false,
          },
          {
            kind: 'actor',
            summary: 'Davies is out collecting the debt',
            ageTurns: 4,
            overdue: true,
            overdueByTurns: 2,
            dueNow: false,
          },
        ],
      })
    );
    expect(prompt).toContain(WORLD_CLOCK_HEADER);
    expect(prompt).toContain('Turn 12. Turns since the world last moved on its own: 3.');
    expect(prompt).toContain('(deadline, open 11 turns) The council vote is in six weeks');
    expect(prompt).toContain('Davies is out collecting the debt [overdue by 2 turns - bring it toward landing]');
    expect(prompt).toContain('MUST advance, bring due, or resolve at least ONE thread above');
    expect(prompt).toContain('never introduce one as new');
    expect(prompt).not.toContain('DUE NOW');
  });

  it('names one due-now thread and lets the segment cut time forward to land it', () => {
    const prompt = sceneTemplate(
      makeContext({
        currentTurn: 12,
        turnsSinceWorldMoved: 3,
        threads: [
          {
            kind: 'deadline',
            summary: 'The environmental report is due',
            ageTurns: 10,
            overdue: true,
            overdueByTurns: 9,
            dueNow: true,
          },
          {
            kind: 'actor',
            summary: 'Davies is out collecting the debt',
            ageTurns: 4,
            overdue: true,
            overdueByTurns: 2,
            dueNow: false,
          },
        ],
      })
    );
    expect(prompt).toContain('The environmental report is due [DUE NOW]');
    expect(prompt).toContain('DUE NOW: The environmental report is due. It has been overdue for 9 turns.');
    expect(prompt).toContain('this segment is a "transition"');
    expect(prompt).toContain('time may jump FORWARD to reach it');
    expect(prompt).toContain('Do not deliver it as fresh news');
    expect(prompt).not.toContain('Prefer an OVERDUE thread');
  });

  it('falls back to an unbidden off-screen move when the ledger is empty', () => {
    const prompt = sceneTemplate(makeContext({ currentTurn: 2, turnsSinceWorldMoved: 1, threads: [] }));
    expect(prompt).toContain(WORLD_CLOCK_HEADER);
    expect(prompt).toContain('The ledger is empty');
    expect(prompt).toContain('NPC roster who is not in the scene');
    expect(prompt).toContain('That move becomes a thread the story now owes');
  });

  it('suppresses the pacing guard while the clock renders, and restores it when the clock is off', () => {
    const withClock = sceneTemplate(
      makeContext({ currentTurn: 8, turnsSinceWorldMoved: 5, threads: [] }, 5)
    );
    expect(withClock).toContain(WORLD_CLOCK_HEADER);
    expect(withClock).not.toContain(PACING_HEADER);

    const withoutClock = sceneTemplate(makeContext(undefined, 5));
    expect(withoutClock).toContain(PACING_HEADER);
    expect(withoutClock).not.toContain(WORLD_CLOCK_HEADER);
  });
});
