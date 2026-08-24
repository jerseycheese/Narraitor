import { sceneTemplate } from '../sceneTemplate';
import type { NarrativeTemplateContext } from '../context';

const WORLD_DESCRIPTION_HEADER =
  'WORLD DESCRIPTION (established at creation — the pressures this world was built around):';
const FLAG_ENV_VAR = 'NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE';

function makeContext(worldDescription?: string): NarrativeTemplateContext {
  return {
    worldName: 'Harrowgate Mills',
    worldDescription,
    genre: 'civic drama',
    tone: 'tense',
    playerCharacterName: 'Wren',
    narrativeContext: {
      recentSegments: [{ content: 'The council room is quiet.' }],
      currentSituation: 'Player chose: "Wait for the meeting to open"',
      currentTags: [],
    },
  };
}

describe('sceneTemplate world description block (#1865, EXPERIMENT — unmeasured)', () => {
  const originalEnv = process.env[FLAG_ENV_VAR];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[FLAG_ENV_VAR];
    } else {
      process.env[FLAG_ENV_VAR] = originalEnv;
    }
  });

  it('omits worldDescription from the prompt by default (flag unset)', () => {
    delete process.env[FLAG_ENV_VAR];
    const prompt = sceneTemplate(
      makeContext('The council votes on the developer\'s offer in six weeks.')
    );
    expect(prompt).not.toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).not.toContain("The council votes on the developer's offer in six weeks.");
  });

  it('renders worldDescription in the prompt when the flag is on', () => {
    process.env[FLAG_ENV_VAR] = 'true';
    const prompt = sceneTemplate(
      makeContext('The council votes on the developer\'s offer in six weeks.')
    );
    expect(prompt).toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).toContain("The council votes on the developer's offer in six weeks.");
  });

  it('does not render worldDescription when the flag is on but the field is absent', () => {
    process.env[FLAG_ENV_VAR] = 'true';
    const prompt = sceneTemplate(makeContext(undefined));
    expect(prompt).not.toContain(WORLD_DESCRIPTION_HEADER);
  });

  it('trims a long description at a word boundary rather than rendering it in full', () => {
    process.env[FLAG_ENV_VAR] = 'true';
    const longDescription = 'A pressing deadline looms over the town. '.repeat(20);
    const prompt = sceneTemplate(makeContext(longDescription));
    expect(prompt).toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).not.toContain(longDescription.trim());
    expect(prompt).toContain('...');
  });

  it('explicitly disables with "false" even though the default is off', () => {
    process.env[FLAG_ENV_VAR] = 'false';
    const prompt = sceneTemplate(makeContext('The deadline is six weeks away.'));
    expect(prompt).not.toContain(WORLD_DESCRIPTION_HEADER);
  });
});
