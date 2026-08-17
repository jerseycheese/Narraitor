/**
 * @fileoverview Verifies each narrative template embeds its example block, and
 * that the budget gate still drops examples when there is no room for them.
 */

import { baseNarrativeTemplate } from '../templates/narrative/baseNarrativeTemplate';
import { sceneTemplate } from '../templates/narrative/sceneTemplate';
import { transitionTemplate } from '../templates/narrative/transitionTemplate';
import { playerChoiceTemplate } from '../templates/narrative/playerChoiceTemplate';
import { skillAcknowledgmentTemplate } from '../templates/narrative/skillAcknowledgmentTemplate';
import {
  PERSPECTIVE_AND_EMPHASIS_EXAMPLES,
  PERSPECTIVE_EXAMPLES,
  CHOICE_EXAMPLES,
  SKILL_ACKNOWLEDGMENT_EXAMPLES,
} from './index';

const baseContext = {
  worldName: 'Test World',
  worldDescription: 'A test world',
  genre: 'fantasy',
  tone: 'dark',
  attributes: [],
};

const sceneContext = {
  ...baseContext,
  narrativeContext: { recentSegments: [{ content: 'Previous scene content' }] },
  generationParameters: { segmentType: 'scene' },
};

const transitionContext = {
  ...baseContext,
  previousContent: 'Previous content',
  previousType: 'scene',
};

const skillContext = {
  worldName: 'Test World',
  genre: 'fantasy',
  playerCharacterName: 'Alex',
  skillUsed: {
    skillId: 'lockpicking',
    skillName: 'Lockpicking',
    success: true,
    difficulty: 3,
  },
};

describe('narrative templates embed their examples', () => {
  it('base narrative gets the perspective and emphasis set', () => {
    expect(baseNarrativeTemplate(baseContext)).toContain(
      PERSPECTIVE_AND_EMPHASIS_EXAMPLES
    );
  });

  it('scene and transition share the perspective set', () => {
    expect(sceneTemplate(sceneContext)).toContain(PERSPECTIVE_EXAMPLES);
    expect(transitionTemplate(transitionContext)).toContain(PERSPECTIVE_EXAMPLES);
  });

  it('player choice gets the choice set', () => {
    expect(playerChoiceTemplate({ ...baseContext, optionCount: 3 })).toContain(
      CHOICE_EXAMPLES
    );
  });

  it('skill acknowledgment ships both outcomes, whether the skill hit or missed', () => {
    const onSuccess = skillAcknowledgmentTemplate(skillContext);
    const onFailure = skillAcknowledgmentTemplate({
      ...skillContext,
      skillUsed: { ...skillContext.skillUsed, success: false },
    });

    expect(onSuccess).toContain(SKILL_ACKNOWLEDGMENT_EXAMPLES);
    expect(onFailure).toContain(SKILL_ACKNOWLEDGMENT_EXAMPLES);
  });
});

describe('the skill acknowledgment failure exemplar costs something', () => {
  it('does not model failure as the world refusing to move', () => {
    const costlessPhrasings = [
      /remains? (stubbornly )?locked/i,
      /refuses to budge/i,
      /nothing (happens|changes)/i,
      /no closer than before/i,
    ];

    costlessPhrasings.forEach((phrasing) => {
      expect(SKILL_ACKNOWLEDGMENT_EXAMPLES).not.toMatch(phrasing);
    });
  });
});

describe('the context-length gate still drops examples', () => {
  it('scene omits examples once the context is long enough to stand on its own', () => {
    const result = sceneTemplate({
      ...sceneContext,
      narrativeContext: { recentSegments: [{ content: 'x'.repeat(6000) }] },
    });

    expect(result).not.toContain('EXAMPLES:');
  });
});
