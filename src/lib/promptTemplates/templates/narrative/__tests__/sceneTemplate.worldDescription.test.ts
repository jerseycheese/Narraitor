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

describe('sceneTemplate world description block (#1865, SHIPPED)', () => {
  const originalEnv = process.env[FLAG_ENV_VAR];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[FLAG_ENV_VAR];
    } else {
      process.env[FLAG_ENV_VAR] = originalEnv;
    }
  });

  it('renders worldDescription in the prompt by default (flag unset)', () => {
    delete process.env[FLAG_ENV_VAR];
    const prompt = sceneTemplate(
      makeContext('The council votes on the developer\'s offer in six weeks.')
    );
    expect(prompt).toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).toContain("The council votes on the developer's offer in six weeks.");
  });

  it('omits worldDescription from the prompt when explicitly disabled with "false"', () => {
    process.env[FLAG_ENV_VAR] = 'false';
    const prompt = sceneTemplate(
      makeContext('The council votes on the developer\'s offer in six weeks.')
    );
    expect(prompt).not.toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).not.toContain("The council votes on the developer's offer in six weeks.");
  });

  it('does not render worldDescription when the field is absent', () => {
    delete process.env[FLAG_ENV_VAR];
    const prompt = sceneTemplate(makeContext(undefined));
    expect(prompt).not.toContain(WORLD_DESCRIPTION_HEADER);
  });

  it('trims a long description at a word boundary rather than rendering it in full', () => {
    delete process.env[FLAG_ENV_VAR];
    const longDescription = 'A pressing deadline looms over the town. '.repeat(20);
    const prompt = sceneTemplate(makeContext(longDescription));
    expect(prompt).toContain(WORLD_DESCRIPTION_HEADER);
    expect(prompt).not.toContain(longDescription.trim());
    expect(prompt).toContain('...');
  });
});
