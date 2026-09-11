import { descriptionsToSelectOptions } from '../enumHelpers';

describe('descriptionsToSelectOptions', () => {
  it('title-cases keys by default', () => {
    const options = descriptionsToSelectOptions({
      'action-packed': 'Fast-paced and exciting',
    });

    expect(options[0].label).toBe('Action Packed');
  });

  it('uses a custom formatter when given, instead of title-casing abbreviations', () => {
    // Issue #2082: content rating keys (G, PG, PG-13, ...) are already
    // correctly cased. The default titleCase formatter would mangle "PG"
    // into "Pg", so callers pass through an identity formatter.
    const options = descriptionsToSelectOptions(
      { PG: 'Parental guidance - Mild themes and language' },
      (key) => key
    );

    expect(options[0].label).toBe('PG');
  });
});
