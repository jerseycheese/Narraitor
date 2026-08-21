export type NarrativeLength = 'short' | 'medium' | 'long';

const LENGTH_GUIDE: Record<NarrativeLength, string> = {
  short: '3-5 sentences (1 focused paragraph)',
  medium: '1-2 paragraphs',
  long: '3-4 paragraphs',
};

/**
 * The reader only sees paragraphs where the renderer can split on a blank line.
 * A model told to write "1-2 paragraphs" will happily satisfy that as one
 * unbroken block, so the separator has to be asked for outright.
 */
export const PARAGRAPH_SEPARATOR_INSTRUCTION =
  'Separate each paragraph with a blank line (one empty line between them), never a single line break';

/**
 * Weightier beats earn more room on the page. Without this every segment comes
 * back the same size, which is a large part of why long sessions read flat.
 * decisionWeight is the only length signal available before generation —
 * metadata.majorEvent is computed from the response, too late to shape it.
 */
const LENGTH_BY_DECISION_WEIGHT: Record<string, NarrativeLength> = {
  minor: 'short',
  major: 'medium',
  critical: 'long',
};

export interface NarrativeLengthSignals {
  desiredLength?: NarrativeLength;
  decisionWeight?: string;
}

/**
 * An explicit desiredLength always wins — callers that need a deliberately
 * small beat (item use, acknowledgments) say so. Otherwise the decision's
 * weight drives it, falling back to short for unweighted beats.
 */
export function resolveNarrativeLength(
  signals?: NarrativeLengthSignals
): NarrativeLength {
  if (signals?.desiredLength && LENGTH_GUIDE[signals.desiredLength]) {
    return signals.desiredLength;
  }

  const weight = signals?.decisionWeight;
  if (weight && LENGTH_BY_DECISION_WEIGHT[weight]) {
    return LENGTH_BY_DECISION_WEIGHT[weight];
  }

  return 'short';
}

/** The prose fragment a prompt template drops into its length instruction. */
export function describeNarrativeLength(
  signals?: NarrativeLengthSignals
): string {
  return LENGTH_GUIDE[resolveNarrativeLength(signals)];
}
