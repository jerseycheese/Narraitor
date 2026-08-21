import { playerChoiceTemplate } from '../playerChoiceTemplate';
import { alignedChoiceTemplate } from '../choiceTypeTemplates';
import type { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';

const segment: NarrativeSegment = {
  id: 'segment-1',
  worldId: 'world-1',
  sessionId: 'session-1',
  content: 'The radio in the corner has been dead for days.',
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['char-1'],
  previousSegments: [segment],
  recentSegments: [segment],
  currentTags: [],
  sessionId: 'session-1',
  currentSituation: 'Deciding whether to move on',
};

const baseContext = {
  worldName: 'Butler County Outskirts',
  genre: 'zombie survival',
  narrativeContext,
};

const countScaffoldedOptionLines = (prompt: string): number => {
  const optionsSection = prompt.split('Options:')[1] ?? '';
  return optionsSection.split('\n').filter((line) => /^\d+\.\s/.test(line)).length;
};

describe('choice templates ask for as many options as the interface shows', () => {
  it('scaffolds three options by default in the plain choice template', () => {
    const prompt = playerChoiceTemplate(baseContext);

    expect(prompt).toContain('create 3 distinct action choices');
    expect(countScaffoldedOptionLines(prompt)).toBe(3);
  });

  it('scaffolds three options by default in the aligned choice template', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toContain('create 3 distinct action choices');
    expect(countScaffoldedOptionLines(prompt)).toBe(3);
  });

  it('honors an explicit option count in the aligned choice template', () => {
    const prompt = alignedChoiceTemplate({ ...baseContext, optionCount: 5 });

    expect(prompt).toContain('create 5 distinct action choices');
    expect(countScaffoldedOptionLines(prompt)).toBe(5);
  });

  it('leaves the alignment mix to the scene instead of pinning a tag to each slot', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toContain('[LAWFUL]');
    expect(prompt).not.toContain('1 lawful, 2 neutral, 1 chaotic');
    expect(prompt).toMatch(/do NOT repeat the same mix turn after turn/i);
  });
});

describe('choice templates keep the player out of their own options', () => {
  it('names the protagonist and rules them out as a target in the aligned template', () => {
    const prompt = alignedChoiceTemplate({
      ...baseContext,
      playerCharacterName: 'Wren Calloway',
    });

    expect(prompt).toContain('PROTAGONIST: The player is Wren Calloway.');
    expect(prompt).toMatch(/never the person an option targets/i);
  });

  it('says nothing about a protagonist when no player name is supplied', () => {
    expect(alignedChoiceTemplate(baseContext)).not.toContain('PROTAGONIST:');
  });
});
