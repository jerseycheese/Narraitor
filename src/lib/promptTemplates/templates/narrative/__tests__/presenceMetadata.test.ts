import { isFeatureEnabled } from '@/lib/featureFlags';
import { actionTemplate } from '../actionTemplate';
import { initialSceneTemplate } from '../initialSceneTemplate';
import { sceneTemplate } from '../sceneTemplate';
import { transitionTemplate } from '../transitionTemplate';

jest.mock('@/lib/featureFlags', () => ({ isFeatureEnabled: jest.fn(() => false) }));

const context = {
  worldName: 'Test World',
  genre: 'fantasy',
  tone: 'tense',
  previousContent: 'The guard waits.',
  previousType: 'scene',
  npcRoster: [{ id: 'npc-guard', name: 'Guard' }],
};

it.each([sceneTemplate, actionTemplate, initialSceneTemplate, transitionTemplate])(
  'adds movement fields only when SCENE_STATE is enabled',
  (template) => {
    const flagOff = template(context);
    expect(flagOff).not.toContain('sceneEntries');
    expect(flagOff).not.toContain('sceneExits');

    (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
    try {
      const flagOn = template(context);
      expect(flagOn).toContain('metadata.sceneEntries');
      expect(flagOn).toContain('metadata.sceneExits');
      expect(flagOn).toContain('"sceneEntries": []');
      expect(flagOn).toContain('"sceneExits": []');
    } finally {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    }
  }
);
