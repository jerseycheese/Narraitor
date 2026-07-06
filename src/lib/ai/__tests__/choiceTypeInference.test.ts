/**
 * Tests for choice type mapping used in Issue #142 integration.
 *
 * Player choices are categorized for PlayerDecisionTracker via alignment-based
 * mapping. Choices without an explicit alignment fall back to neutral.
 */

import { mapAlignmentToChoiceType } from '../../narrative/choiceType';

describe('Choice type mapping for PlayerDecisionTracker integration', () => {
  it('maps lawful alignment to diplomatic', () => {
    expect(mapAlignmentToChoiceType('lawful')).toBe('diplomatic');
  });

  it('maps chaotic alignment to aggressive', () => {
    expect(mapAlignmentToChoiceType('chaotic')).toBe('aggressive');
  });

  it('maps neutral alignment to neutral', () => {
    expect(mapAlignmentToChoiceType('neutral')).toBe('neutral');
  });

  it('falls back to neutral when no alignment is present', () => {
    expect(mapAlignmentToChoiceType(undefined)).toBe('neutral');
  });
});
