import { calculateComplexityMetrics, evaluateLanguageComplexity } from '../languageComplexity';

describe('languageComplexity utilities', () => {
  it('computes sentence and word metrics', () => {
    const text = 'Hello world. This is a simple test.';
    const metrics = calculateComplexityMetrics(text);

    expect(metrics.totalSentences).toBe(2);
    expect(metrics.totalWords).toBeGreaterThan(0);
    expect(metrics.averageSentenceLength).toBeGreaterThan(0);
  });

  it('passes simple text for simple complexity', () => {
    const text = 'You walk into the room. The light is soft. Friends smile at you.';
    const evaluation = evaluateLanguageComplexity(text, 'simple');

    expect(evaluation.passes).toBe(true);
  });

  it('flags complex text for simple complexity', () => {
    const text = 'Calibrated luminescence surges through the labyrinthine conduits, illuminating iridescent glyphs with inexorable precision.';
    const evaluation = evaluateLanguageComplexity(text, 'simple');

    expect(evaluation.passes).toBe(false);
    expect(evaluation.reasons).toBeDefined();
  });

  it('flags overly dense text for moderate complexity', () => {
    const text = 'With painstaking deliberation, the archivist articulates a hypothesis concerning the interlaced chronologies of forgotten empires, weaving a labyrinth of clauses that stretches far beyond a comfortable breath.';
    const evaluation = evaluateLanguageComplexity(text, 'moderate');

    expect(evaluation.passes).toBe(false);
    expect(evaluation.reasons).toBeDefined();
  });

  it('allows rich prose within advanced thresholds', () => {
    const text = "Beneath the opalescent canopy of nebulae, the captain considers the quiet rebellion simmering behind her crew's measured expressions.";
    const evaluation = evaluateLanguageComplexity(text, 'advanced');

    expect(evaluation.passes).toBe(true);
  });
});
