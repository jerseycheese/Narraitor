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

  it('keeps escalating the guidance for longer streaks', () => {
    const prompt = sceneTemplate(makeContext(9));
    expect(prompt).toContain('9 turns in a row');
  });
});
