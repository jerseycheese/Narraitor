/**
 * Integration between the decision tracker and the character prompt section:
 * decisions recorded during play should shape what the prompt says about how
 * the player likes to play.
 */

import { buildCharacterPromptSection } from '../personalizationEngine';
import { PlayerDecisionTracker } from '../playerDecisionTracker';

describe('decision tracker feeds the character prompt section', () => {
  let tracker: PlayerDecisionTracker;

  const readDecisions = () =>
    tracker.getRelevantDecisions({ worldId: 'world-1' }, 10, {
      worldId: 'world-1',
    });

  beforeEach(() => {
    tracker = new PlayerDecisionTracker({
      storageKey: 'test_personalization_decisions',
    });
    tracker.clearDecisions();
  });

  it('carries the tracked choice types through to the prompt', () => {
    tracker.recordDecision(
      'What do you do?',
      'Help the stranger',
      'helpful',
      'session-1',
      'world-1'
    );
    tracker.recordDecision(
      'How do you respond?',
      'Negotiate peacefully',
      'diplomatic',
      'session-1',
      'world-1'
    );

    const decisions = readDecisions();
    expect(decisions).toHaveLength(2);

    const section = buildCharacterPromptSection({
      name: 'Alex Archer',
      goals: [],
      decisions,
    });

    expect(section).toContain('Alex Archer');
    expect(section).toMatch(/helpful|diplomatic/i);
  });

  it('surfaces a consistent play pattern as the preferred style', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordDecision(
        `Situation ${i}`,
        'Negotiate',
        'diplomatic',
        'session-1',
        'world-1'
      );
    }

    const decisions = readDecisions();
    const analysis = tracker.analyzeChoicePatterns(decisions);

    expect(analysis.dominantChoiceTypes[0]).toBe('diplomatic');
    expect(analysis.patternStrength).toBeGreaterThan(50);

    const section = buildCharacterPromptSection({
      name: 'Alex Archer',
      goals: [],
      decisions,
    });

    expect(section).toContain('PREFERRED PLAY STYLE: diplomatic');
  });
});
