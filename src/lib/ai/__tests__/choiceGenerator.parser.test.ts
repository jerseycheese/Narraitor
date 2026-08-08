import { parseChoiceResponse, applyAlignmentConsequences } from '../choiceGenerator.parser';
import type { Decision, NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['char-1'],
  previousSegments: [],
  currentTags: [],
  sessionId: 'session-1',
};

describe('parseChoiceResponse', () => {
  it('parses prompt, alignment, hints, and requirements', () => {
    const world = createMockWorld({
      id: 'world-1',
      skills: [
        {
          id: 'skill-1',
          worldId: 'world-1',
          name: 'Stealth',
          description: 'Stay hidden',
          difficulty: 'easy',
          baseValue: 1,
          minValue: 0,
          maxValue: 5,
        },
      ],
    });

    const content = `Decision Weight: [major]
Context Summary: A tense moment.
Decision: What do you do?

1. [Lawful] Slip past the guard
Hint: Use the shadows
Requirements: Stealth 3+
2. [Chaotic] Kick down the door
Hint: Loud but fast`;

    const decision = parseChoiceResponse(content, narrativeContext, world);

    expect(decision.decisionWeight).toBe('major');
    expect(decision.prompt).toBe('What do you do?');
    expect(decision.options).toHaveLength(2);
    expect(decision.options[0].alignment).toBe('lawful');
    expect(decision.options[0].hint).toBe('Use the shadows');
    expect(decision.options[0].requirements?.[0]).toEqual({
      type: 'skill',
      targetId: 'skill-1',
      operator: 'gte',
      value: 3,
    });
    expect(decision.options[1].alignment).toBe('chaotic');
  });

  it('parses bracketed multi-word skill requirements', () => {
    const world = createMockWorld({
      id: 'world-1',
      skills: [
        {
          id: 'skill-1',
          worldId: 'world-1',
          name: 'Lock Picking',
          description: 'Open locks without keys',
          difficulty: 'medium',
          baseValue: 1,
          minValue: 0,
          maxValue: 10,
        },
      ],
    });

    const content = `Decision Weight: [minor]
Context Summary: A locked service door blocks your path.
Decision: What do you do?

1. [Neutral] Pick the service door lock
Hint: Quiet and precise
Requirements: [Lock Picking 6+]
2. [Chaotic] Kick the door open`;

    const decision = parseChoiceResponse(content, narrativeContext, world);

    expect(decision.options[0].requirements?.[0]).toEqual({
      type: 'skill',
      targetId: 'skill-1',
      operator: 'gte',
      value: 6,
    });
  });

  it('strips inline skill requirement annotations from option text', () => {
    const world = createMockWorld({
      id: 'world-1',
      skills: [
        {
          id: 'skill-1',
          worldId: 'world-1',
          name: 'Stealth',
          description: 'Stay hidden',
          difficulty: 'easy',
          baseValue: 1,
          minValue: 0,
          maxValue: 10,
        },
      ],
    });

    const content = `Decision Weight: [minor]
Context Summary: Avoid the patrol.
Decision: What do you do?

1. [Neutral] Slip behind the cart [Stealth 5+]
Requirements: [Stealth 5+]
2. [Lawful] Wait for official escort`;

    const decision = parseChoiceResponse(content, narrativeContext, world);

    expect(decision.options[0].text).toBe('Slip behind the cart');
    expect(decision.options[0].text).not.toMatch(/\d\+/);
    expect(decision.options[0].requirements?.[0]).toEqual({
      type: 'skill',
      targetId: 'skill-1',
      operator: 'gte',
      value: 5,
    });
  });

  // The model sometimes appends the requirement to the option text instead of
  // putting it on its own line. That form used to survive into option.text and
  // get read out to the player as "Requirements: Persuasion 3+".
  it('strips a trailing Requirements phrase from option text', () => {
    const world = createMockWorld({
      id: 'world-1',
      skills: [
        {
          id: 'skill-1',
          worldId: 'world-1',
          name: 'Persuasion',
          description: 'Talk people round',
          difficulty: 'medium',
          baseValue: 1,
          minValue: 0,
          maxValue: 10,
        },
      ],
    });

    const content = `Decision Weight: [minor]
Context Summary: Silas is guarding the crates.
Decision: What do you do?

1. [Neutral] Offer Silas a fair trade. Requirements: Persuasion 3+
2. [Lawful] Walk away`;

    const decision = parseChoiceResponse(content, narrativeContext, world);

    expect(decision.options[0].text).toBe('Offer Silas a fair trade.');
    expect(decision.options[0].text).not.toMatch(/requirement/i);
    expect(decision.options[0].requirements?.[0]).toEqual({
      type: 'skill',
      targetId: 'skill-1',
      operator: 'gte',
      value: 3,
    });
  });
});

describe('parseChoiceResponse consequences', () => {
  const knownNpcs = [
    { id: 'npc-1', name: 'Marta' },
    { id: 'npc-2', name: 'Guild Master Hollis' },
  ];

  const buildContent = (consequencesLine: string) => `Decision Weight: [major]
Decision: What do you do?

1. [Lawful] Return the ledger to Marta
${consequencesLine}
2. [Neutral] Walk away`;

  it('parses trust deltas against the known NPC roster', () => {
    const world = createMockWorld({ id: 'world-1' });
    const decision = parseChoiceResponse(
      buildContent('Consequences: Marta trust +10, Guild Master Hollis trust -5'),
      narrativeContext,
      world,
      knownNpcs
    );

    expect(decision.options[0].consequences).toEqual(
      expect.arrayContaining([
        { type: 'relationship', action: 'modify', targetId: 'npc-1', value: { trustDelta: 10 } },
        { type: 'relationship', action: 'modify', targetId: 'npc-2', value: { trustDelta: -5 } },
      ])
    );
  });

  it('resolves NPC names case-insensitively and clamps deltas to +/-20', () => {
    const world = createMockWorld({ id: 'world-1' });
    const decision = parseChoiceResponse(
      buildContent('Consequences: MARTA trust -75'),
      narrativeContext,
      world,
      knownNpcs
    );

    const relationship = decision.options[0].consequences?.find(
      (consequence) => consequence.type === 'relationship'
    );
    expect(relationship).toEqual({
      type: 'relationship',
      action: 'modify',
      targetId: 'npc-1',
      value: { trustDelta: -20 },
    });
  });

  it('drops consequences naming unknown characters', () => {
    const world = createMockWorld({ id: 'world-1' });
    const decision = parseChoiceResponse(
      buildContent('Consequences: Stranger trust +10'),
      narrativeContext,
      world,
      knownNpcs
    );

    const relationships = decision.options[0].consequences?.filter(
      (consequence) => consequence.type === 'relationship'
    );
    expect(relationships ?? []).toHaveLength(0);
  });

  it('leaves options without a Consequences line free of relationship consequences', () => {
    const world = createMockWorld({ id: 'world-1' });
    const decision = parseChoiceResponse(
      buildContent('Hint: Just a hint'),
      narrativeContext,
      world,
      knownNpcs
    );

    expect(
      decision.options.flatMap((option) =>
        (option.consequences ?? []).filter((c) => c.type === 'relationship')
      )
    ).toHaveLength(0);
  });
});

describe('applyAlignmentConsequences', () => {
  const makeDecision = (decisionWeight?: 'minor' | 'major' | 'critical'): Decision => ({
    id: 'decision-1',
    prompt: 'What do you do?',
    decisionWeight,
    options: [
      { id: 'opt-1', text: 'Follow the law', alignment: 'lawful' },
      { id: 'opt-2', text: 'Stay practical', alignment: 'neutral' },
      { id: 'opt-3', text: 'Burn it down', alignment: 'chaotic' },
    ],
  });

  it('adds signed alignment consequences scaled by decision weight', () => {
    const decision = applyAlignmentConsequences(makeDecision('critical'));

    expect(decision.options[0].consequences).toEqual([
      { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 12 },
    ]);
    expect(decision.options[2].consequences).toEqual([
      { type: 'alignment', action: 'add', targetId: 'player-alignment', value: -12 },
    ]);
  });

  it('defaults to the minor magnitude and skips neutral options', () => {
    const decision = applyAlignmentConsequences(makeDecision());

    expect(decision.options[0].consequences?.[0].value).toBe(4);
    expect(decision.options[1].consequences).toBeUndefined();
  });

  it('does not duplicate an existing alignment consequence', () => {
    const base = makeDecision('major');
    base.options[0] = {
      ...base.options[0],
      consequences: [
        { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 8 },
      ],
    };

    const decision = applyAlignmentConsequences(applyAlignmentConsequences(base));

    expect(
      decision.options[0].consequences?.filter((c) => c.type === 'alignment')
    ).toHaveLength(1);
  });
});
