import { initialSceneTemplate } from '../initialSceneTemplate';
import { actionTemplate } from '../actionTemplate';
import type { NarrativeTemplateContext } from '../context';

function makeInitialContext(
  fatalRiskAllowed?: boolean,
  isFatalRepair?: boolean
): NarrativeTemplateContext {
  return {
    worldName: 'Crystal Lake',
    genre: 'horror',
    tone: 'grim',
    playerCharacterName: 'Tommy',
    fatalRiskAllowed,
    isFatalRepair,
    generationParameters: {
      fatalRiskAllowed,
      isFatalRepair,
    },
  };
}

describe('initialSceneTemplate survival constraint and repair instructions', () => {
  it('renders survival constraint when fatalRiskAllowed is false', () => {
    const prompt = initialSceneTemplate(makeInitialContext(false, false));
    expect(prompt).toContain('SURVIVAL CONSTRAINT (DEATH COOLDOWN ACTIVE):');
    expect(prompt).toContain('The player character MUST survive this turn.');
  });

  it('renders repair instructions when isFatalRepair is true', () => {
    const prompt = initialSceneTemplate(makeInitialContext(false, true));
    expect(prompt).toContain(
      'REPAIR INSTRUCTION — PREVIOUS DRAFT CONTAINED FORBIDDEN DEATH:'
    );
    expect(prompt).toContain(
      'You MUST rewrite the outcome so the player character SURVIVES this encounter.'
    );
  });

  it('omits repair instructions when isFatalRepair is false', () => {
    const prompt = initialSceneTemplate(makeInitialContext(false, false));
    expect(prompt).not.toContain(
      'REPAIR INSTRUCTION — PREVIOUS DRAFT CONTAINED FORBIDDEN DEATH:'
    );
  });
});

describe('actionTemplate survival constraint and repair instructions', () => {
  it('renders survival constraint when fatalRiskAllowed is false', () => {
    const prompt = actionTemplate({
      worldName: 'Crystal Lake',
      genre: 'horror',
      tone: 'grim',
      generationParameters: {
        fatalRiskAllowed: false,
      },
    });
    expect(prompt).toContain('SURVIVAL CONSTRAINT (DEATH COOLDOWN ACTIVE):');
    expect(prompt).toContain('The player character MUST survive this turn.');
  });

  it('renders repair instructions when isFatalRepair is true', () => {
    const prompt = actionTemplate({
      worldName: 'Crystal Lake',
      genre: 'horror',
      tone: 'grim',
      generationParameters: {
        fatalRiskAllowed: false,
        isFatalRepair: true,
      },
    });
    expect(prompt).toContain(
      'REPAIR INSTRUCTION — PREVIOUS DRAFT CONTAINED FORBIDDEN DEATH:'
    );
    expect(prompt).toContain(
      'You MUST rewrite the outcome so the player character SURVIVES this encounter.'
    );
  });
});
