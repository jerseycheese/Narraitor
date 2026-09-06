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
            fired: false,
            strikes: 0,
          },
          {
            kind: 'actor',
            summary: 'Davies is out collecting the debt',
            ageTurns: 4,
            overdue: true,
            overdueByTurns: 1,
            dueNow: false,
            fired: false,
            strikes: 0,
          },
        ],
      })
    );
    expect(prompt).toContain(WORLD_CLOCK_HEADER);
    expect(prompt).toContain('Turn 12. Turns since the world last moved on its own: 3.');
    expect(prompt).toContain('(deadline, open 11 turns) The council vote is in six weeks');
    expect(prompt).toContain(
      'Davies is out collecting the debt [overdue by 1 turn - bring it toward landing]'
    );
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
            fired: false,
            strikes: 0,
          },
          {
            kind: 'actor',
            summary: 'Davies is out collecting the debt',
            ageTurns: 4,
            overdue: true,
            overdueByTurns: 2,
            dueNow: false,
            fired: false,
            strikes: 0,
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

  it('replaces immediate-continuity rules when the resolver requests a transition', () => {
    const context = makeContext({
      currentTurn: 12,
      turnsSinceWorldMoved: 3,
      threads: [],
    });
    context.generationParameters = { segmentType: 'transition' };

    const prompt = sceneTemplate(context);

    expect(prompt).toContain('cross the requested scene boundary');
    expect(prompt).toContain('Open on the far side of the transition');
    expect(prompt).not.toContain('Pick up IMMEDIATELY');
  });

  it('renders a fired thread as already in the scene by its own summary, and asks for something new when everything has fired', () => {
    const fired = {
      kind: 'actor' as const,
      summary: 'Henderson comes to collect the roof loan',
      ageTurns: 13,
      overdue: false,
      overdueByTurns: 0,
      dueNow: false,
      fired: true,
      firedAtTurn: 12,
      strikes: 0,
    };
    const oneFired = sceneTemplate(makeContext({ currentTurn: 14, turnsSinceWorldMoved: 1, threads: [fired] }));
    expect(oneFired).toContain('Henderson comes to collect the roof loan [IN THE SCENE since turn 12]');
    expect(oneFired).not.toContain('[overdue by');
    expect(oneFired).not.toContain('DUE NOW');
    expect(oneFired).toContain('has already arrived');
    expect(oneFired).toContain('never arrive it again');
    expect(oneFired).toContain('Every thread above is already in the scene');
    expect(oneFired).toContain('NPC roster who is not in the scene');

    const withUnfired = sceneTemplate(
      makeContext({
        currentTurn: 14,
        turnsSinceWorldMoved: 1,
        threads: [
          fired,
          { kind: 'deadline', summary: 'The agreement is signed', ageTurns: 12, overdue: true, overdueByTurns: 10, dueNow: true, fired: false, strikes: 0 },
        ],
      })
    );
    expect(withUnfired).toContain('DUE NOW: The agreement is signed.');
    expect(withUnfired).not.toContain('Every thread above is already in the scene');
  });

  it('demands the strike, the cost or the outcome when the DUE NOW pick is a fired thread', () => {
    const prompt = sceneTemplate(
      makeContext({
        currentTurn: 15,
        turnsSinceWorldMoved: 2,
        threads: [
          {
            kind: 'actor',
            summary: 'The creature is inside the shed',
            ageTurns: 9,
            overdue: false,
            overdueByTurns: 0,
            dueNow: true,
            fired: true,
            firedAtTurn: 12,
            strikes: 0,
          },
          { kind: 'deadline', summary: 'Dawn comes', ageTurns: 3, overdue: false, overdueByTurns: 0, dueNow: false, fired: false, strikes: 0 },
        ],
      })
    );
    expect(prompt).toContain('The creature is inside the shed [IN THE SCENE since turn 12, DUE NOW]');
    expect(prompt).toContain('IN THE SCENE AND DUE NOW: The creature is inside the shed. It has been in the scene since turn 12');
    expect(prompt).toContain('The DUE NOW thread acts this segment');
    expect(prompt).toContain('it acts on the character, now, and the act costs them');
    expect(prompt).toContain('name it in itemsLost with lossReason "stolen" or "destroyed"');
    expect(prompt).toContain('no time cut is needed and none is granted');
    expect(prompt).not.toContain('this segment is a "transition"');
    expect(prompt).not.toContain('It has been overdue for');
  });

  it('asks the matter to conclude, with a forward cut, once a fired pick has struck out', () => {
    const prompt = sceneTemplate(
      makeContext({
        currentTurn: 24,
        turnsSinceWorldMoved: 1,
        register: 'slasher; the woods are hungry',
        threads: [
          {
            kind: 'actor',
            summary: 'The thing from the boathouse hunts the shore',
            ageTurns: 16,
            overdue: false,
            overdueByTurns: 0,
            dueNow: true,
            fired: true,
            firedAtTurn: 8,
            strikes: 3,
          },
        ],
      })
    );
    expect(prompt).toContain('It has been in the scene since turn 8 and it has acted 3 times without the matter closing. It does not act again.');
    expect(prompt).toContain('In THIS segment the matter CONCLUDES');
    expect(prompt).toContain('the actor is gone or permanently changed, or the character is somewhere else and out of its reach');
    expect(prompt).toContain('this segment is a "transition"');
    expect(prompt).toContain('time may jump FORWARD');
    expect(prompt).not.toContain('it acts on the character, now, and the act costs them');
    expect(prompt).not.toContain('no time cut is needed and none is granted');
  });

  it('names the resolve-turn caption shape in the no-leak rule on every render', () => {
    const prompt = sceneTemplate(makeContext({ currentTurn: 2, turnsSinceWorldMoved: 1, threads: [] }));
    expect(prompt).toContain('Never copy a ledger line above into the passage as a heading, a label or a summary sentence, bold or plain');
    expect(prompt).toContain('when a thread resolves, the prose shows the outcome happening and never captions it');
  });

  it('asks for the act in the world\'s own register when the context carries one, and never lets the block into the passage', () => {
    const fired = {
      kind: 'actor' as const,
      summary: "Albright's call demands an answer",
      ageTurns: 9,
      overdue: false,
      overdueByTurns: 0,
      dueNow: true,
      fired: true,
      firedAtTurn: 9,
      strikes: 0,
    };
    const withRegister = sceneTemplate(
      makeContext({
        currentTurn: 12,
        turnsSinceWorldMoved: 1,
        register: 'small-town civic drama; tension comes from money, memory and who owes whom, never from violence',
        threads: [fired],
      })
    );
    expect(withRegister).toContain(
      'in its own register: "small-town civic drama; tension comes from money, memory and who owes whom, never from violence"'
    );
    expect(withRegister).not.toContain('strikes, takes, seizes');
    expect(withRegister).toContain('Nothing in this block reaches the passage');

    const withoutRegister = sceneTemplate(
      makeContext({ currentTurn: 12, turnsSinceWorldMoved: 1, threads: [fired] })
    );
    expect(withoutRegister).toContain('in its own register (the Tone above)');
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
