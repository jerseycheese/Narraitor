/**
 * Skill-gated choices have to survive the trip back through
 * generatePlayerChoices. The method is a pass-through to the choice generator,
 * and its catch path deliberately substitutes generic options carrying no skill
 * requirements (asserted in narrativeGenerator.choices.test.ts). This file
 * guards the other half: on the success path the requirements the choice
 * generator produced reach the caller untouched, because ChoiceSelector and
 * RequirementBadges render them and gate selection on them.
 *
 * Whether character skills reach the prompt at all is the choice generator's
 * own contract, covered in choiceGenerator.skillBased.test.ts.
 */

jest.mock('../choiceGenerator');

import { NarrativeGenerator } from '../narrativeGenerator';
import { NarrativeContext } from '@/types/narrative.types';
import { createMockAIClient } from './narrativeGenerator.skill.testHelpers';
import { generateChoices } from '../choiceGenerator';

describe('NarrativeGenerator - Skill-Based Choices', () => {
  let narrativeGenerator: NarrativeGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    narrativeGenerator = new NarrativeGenerator(createMockAIClient());
  });

  test('returns each option with the skill requirements the choice generator set on it', async () => {
    (generateChoices as jest.Mock).mockResolvedValue({
      id: 'decision-with-skills',
      prompt: 'What approach will you take?',
      options: [
        {
          id: 'opt-1',
          text: 'Climb the wall',
          requirements: [
            { type: 'skill', targetId: 'athletics', operator: 'gte', value: 5 },
          ],
        },
        {
          id: 'opt-2',
          text: 'Cast a levitation spell',
          requirements: [
            { type: 'skill', targetId: 'magic', operator: 'gte', value: 4 },
          ],
        },
        { id: 'opt-3', text: 'Look for another way', alignment: 'neutral' },
      ],
    });

    const narrativeContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-3',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['obstacle'],
      currentLocation: 'High Wall',
      currentSituation: 'Facing a tall obstacle',
    };

    const decision = await narrativeGenerator.generatePlayerChoices(
      'skill-world',
      narrativeContext,
      ['char-1']
    );

    expect(decision.options).toEqual([
      expect.objectContaining({
        id: 'opt-1',
        requirements: [
          { type: 'skill', targetId: 'athletics', operator: 'gte', value: 5 },
        ],
      }),
      expect.objectContaining({
        id: 'opt-2',
        requirements: [
          { type: 'skill', targetId: 'magic', operator: 'gte', value: 4 },
        ],
      }),
      expect.objectContaining({ id: 'opt-3' }),
    ]);
    // The ungated option stays ungated: a requirement invented on the way out
    // would lock a choice the generator meant to leave open.
    expect(decision.options[2].requirements).toBeUndefined();
  });
});
