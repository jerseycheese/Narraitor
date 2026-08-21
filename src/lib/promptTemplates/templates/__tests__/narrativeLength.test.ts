// Guards the beat-length wiring: sceneTemplate is the template the main story
// loop actually runs, so a length knob that only baseNarrativeTemplate honors is
// a dead knob. These pin the template TEXT rather than generated prose — asserting
// on a model's output is how a prompt test gets rigged.

import {
  describeNarrativeLength,
  resolveNarrativeLength,
} from '../narrative/narrativeLength';
import { sceneTemplate } from '../narrative/sceneTemplate';

describe('resolveNarrativeLength', () => {
  it('honors an explicit desiredLength over the decision weight', () => {
    expect(
      resolveNarrativeLength({ desiredLength: 'short', decisionWeight: 'critical' })
    ).toBe('short');
  });

  it('scales length with decision weight when no length is requested', () => {
    expect(resolveNarrativeLength({ decisionWeight: 'minor' })).toBe('short');
    expect(resolveNarrativeLength({ decisionWeight: 'major' })).toBe('medium');
    expect(resolveNarrativeLength({ decisionWeight: 'critical' })).toBe('long');
  });

  it('falls back to short for unweighted or unknown signals', () => {
    expect(resolveNarrativeLength()).toBe('short');
    expect(resolveNarrativeLength({ decisionWeight: 'nonsense' })).toBe('short');
  });
});

const buildScene = (generationParameters?: Record<string, unknown>) =>
  sceneTemplate({
    worldName: 'Testworld',
    genre: 'fantasy',
    tone: 'grim',
    narrativeContext: { recentSegments: [{ content: 'Something happened.' }] },
    generationParameters,
  } as Parameters<typeof sceneTemplate>[0]);

describe('sceneTemplate length instruction', () => {
  it('no longer hardcodes a 3-5 sentence cap', () => {
    const longScene = buildScene({ desiredLength: 'long' });
    expect(longScene).toContain(describeNarrativeLength({ desiredLength: 'long' }));
    expect(longScene).not.toContain('3-5 sentences');
  });

  it('gives a critical decision more room than a minor one', () => {
    expect(buildScene({ decisionWeight: 'critical' })).toContain('3-4 paragraphs');
    expect(buildScene({ decisionWeight: 'minor' })).toContain(
      '3-5 sentences (1 focused paragraph)'
    );
  });
});

// The renderer splits on a blank line and the model will otherwise satisfy
// "1-2 paragraphs" as one unbroken block, so the separator has to be asked for
// in the prompt the loop actually sends.
describe('sceneTemplate paragraph separator instruction', () => {
  it('asks for a blank line between paragraphs at medium length', () => {
    expect(buildScene({ desiredLength: 'medium' })).toMatch(/blank line/i);
  });

  it('asks for it at every length the loop can request', () => {
    for (const desiredLength of ['short', 'medium', 'long']) {
      expect(buildScene({ desiredLength })).toMatch(/blank line/i);
    }
  });
});
