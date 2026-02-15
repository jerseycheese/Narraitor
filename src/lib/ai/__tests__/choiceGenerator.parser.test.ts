import { parseChoiceResponse } from '../choiceGenerator.parser';
import type { NarrativeContext } from '@/types/narrative.types';
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
});
