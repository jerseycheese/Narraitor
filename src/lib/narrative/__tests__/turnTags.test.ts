import { mergeTurnTags } from '../turnTags';
import { sceneTemplate } from '@/lib/promptTemplates/templates/narrative/sceneTemplate';

describe('mergeTurnTags', () => {
  it('keeps scene and mood tags riding from the previous segment', () => {
    expect(mergeTurnTags(['forest', 'tense'], ['skill-success:a'])).toEqual([
      'forest',
      'tense',
      'skill-success:a',
    ]);
  });

  it('drops the previous segment skill-check tags', () => {
    expect(
      mergeTurnTags(
        ['forest', 'skill-failure:a', 'skill-roll:4'],
        ['skill-success:a', 'skill-roll:19']
      )
    ).toEqual(['forest', 'skill-success:a', 'skill-roll:19']);
  });

  it('drops previous item-usage tags before building the next turn', () => {
    expect(mergeTurnTags(['forest', 'item-usage'], ['combat'])).toEqual(['forest', 'combat']);
  });
});

describe('scene prompt built from merged turn tags', () => {
  it('gives a success turn success guidance even after a failed turn', () => {
    const prompt = sceneTemplate({
      worldName: 'Butler County Outskirts',
      genre: 'zombie survival',
      tone: 'tense',
      playerCharacterName: 'Alex',
      narrativeContext: {
        recentSegments: [{ content: 'The lock does not give.' }],
        currentSituation: 'Player chose: "Force the door"',
        currentTags: mergeTurnTags(
          ['skill-failure:lockpicking', 'skill-roll:3'],
          ['skill-success:athletics', 'skill-roll:19']
        ),
      },
    });

    expect(prompt).toContain('The player SUCCEEDED at their action');
    expect(prompt).not.toContain('FAILED ATTEMPT');
    expect(prompt).not.toContain('MIXED OUTCOME:');
  });
});
