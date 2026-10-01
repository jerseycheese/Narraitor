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

it('renders recorded scene facts and transition guidance in the scene template only with SCENE_STATE', () => {
  const sceneContext = {
    ...context,
    narrativeContext: {
      currentSituation: 'Player chose: "Head north"',
      sceneState: { location: 'Muddy Lake', presentNpcNames: ['Guard'] },
    },
  };
  const flagOff = sceneTemplate(sceneContext);
  expect(flagOff).not.toContain('CURRENT PLACE:');
  expect(flagOff).not.toContain('PRESENT NPCS:');
  expect(flagOff).not.toContain('sceneTransition');

  (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
  try {
    const flagOn = sceneTemplate(sceneContext);
    expect(flagOn).toContain('CURRENT PLACE: Muddy Lake');
    expect(flagOn).toContain('PRESENT NPCS: Guard');
    expect(flagOn).toContain('metadata.sceneTransition');
    expect(flagOn).not.toContain('"sceneTransition":');
  } finally {
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
  }
});

it.each([sceneTemplate, actionTemplate, initialSceneTemplate, transitionTemplate])(
  'keeps beat instructions out of response examples and flag-off prompts identical',
  (template) => {
    const ledgerContext = { ...context, narrativeContext: { sceneState: {
      location: null, presentNpcNames: [], completedBeats: [
        { id: 'bus-arrival', text: 'The bus arrived.', turnIndex: 11 },
      ],
    } } };
    expect(template(ledgerContext)).toBe(template(context));
    (isFeatureEnabled as jest.Mock).mockImplementation((flag: string) => flag === 'SCENE_STATE');
    try {
      const prompt = template(ledgerContext);
      expect(prompt).toContain('[bus-arrival] (turn 11): The bus arrived.');
      expect(prompt).toContain('metadata.sceneBeat');
      expect(prompt).not.toContain('"sceneBeat":');
      expect(template(context)).toContain('None recorded yet.');
    } finally {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    }
  }
);
