/**
 * The gate between a generated scene and the passage the player reads.
 *
 * Prompt rules that forbid bookkeeping by name are a naming game: each rule
 * kills the shape it enumerates and the next generation answers with one it
 * did not. So the gate matches on SHAPE at the block level rather than on any
 * particular label, and it runs where the passage is stored rather than in the
 * template, which puts every generation path behind one check.
 *
 * Both halves fail open. A passage that the gate would empty is passed through
 * untouched, because a turn that renders nothing is worse than a turn that
 * renders bookkeeping.
 */

/** Recent segments compared for recycled prose. Matches the round-12 measurement window. */
const DEDUPE_WINDOW_SEGMENTS = 4;

/** Dice ratio over word bigrams, calibrated against the round-12 difflib measurements. */
const PARAGRAPH_MATCH_THRESHOLD = 0.7;

/**
 * Short lines legitimately recur (a shouted name, a one-line beat), and a
 * bigram ratio over a handful of words is noise, so only substantial
 * paragraphs are eligible for trimming.
 */
const MIN_COMPARABLE_LENGTH = 60;

/** The wrapper the clock block arrives in when it is not written as a heading. */
const DETAILS_BLOCK_PATTERN = /<details\b[^>]*>[\s\S]*?<\/details\s*>/gi;

const CONTAINER_TAG_PATTERN =
  /<\/?(?:details|summary|div|section|article|aside|header|footer|main|table|thead|tbody|tfoot|tr|td|th)(?:\s[^<>]*)?\/?>/gi;

/**
 * Prefix-matched, so "World Clock Update" and "Player Status" are caught by the
 * same entry that catches the bare label.
 */
const BOOKKEEPING_LABEL_PATTERN =
  /^(?:world\s+(?:clock|state)|player\s+status|character\s+status|current\s+(?:status|goals?|conditions?|threats?|threads?)|status|outstanding\s+goals?|goals?|objectives?|open\s+threads?|threads?|threats?|conditions?|inventory|ledger|cost|clock|time|storyteller['’]?s?\s+note|narrator['’]?s?\s+note|gm\s+note|metadata|summary)\b/i;

const METADATA_LEAD_PATTERN = /^(?:\*\*)?["']?metadata["']?(?:\*\*)?\s*[:=]/i;

const LIST_ITEM_PATTERN = /^(?:[-*+•]|\d+[.)])\s+/;

const BOLD_LEAD_PATTERN = /^\*\*\s*([^*]+?)\s*\*\*\s*:?/;

const BARE_BOLD_HEADING_PATTERN = /^\*\*[^*]+\*\*\s*:?$/;

/**
 * The clock block's own scaffolding, which the model reproduces line for line.
 * These are dropped individually rather than by block, since they arrive mixed
 * into otherwise usable prose.
 */
const SCAFFOLDING_LINE_PATTERNS: RegExp[] = [
  /^[-*+•]\s*\((?:[^)]*\bopen\s+\d+\s+turns?|consequence owed|off-screen actor|deadline|nothing on the ledger)[^)]*\)/i,
  /turns?\s+since\s+the\s+world\s+last\s+moved/i,
  /^\**\s*world\s+clock\b[^.!?]*:?\s*\**$/i,
  /^\[?\s*overdue\b[^\]]*\]?$/i,
];

const splitParagraphs = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const isScaffoldingLine = (line: string): boolean =>
  line.length > 0 && SCAFFOLDING_LINE_PATTERNS.some((pattern) => pattern.test(line));

const isMetadataBlock = (lines: string[]): boolean => {
  if (METADATA_LEAD_PATTERN.test(lines[0])) return true;
  if (lines[0].startsWith('```')) return true;

  const joined = lines.join(' ').trim();
  return joined.startsWith('{') && joined.endsWith('}');
};

const isBookkeepingBlock = (block: string): boolean => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return true;
  if (isMetadataBlock(lines)) return true;

  const [firstLine, ...bodyLines] = lines;
  const boldLead = firstLine.match(BOLD_LEAD_PATTERN);
  if (!boldLead) return false;

  const label = boldLead[1].replace(/[:\s]+$/, '');
  if (BOOKKEEPING_LABEL_PATTERN.test(label)) return true;

  // A heading standing alone over a list of states is a ledger whatever it is
  // called, which is what catches the label the next generation invents.
  return (
    BARE_BOLD_HEADING_PATTERN.test(firstLine) &&
    bodyLines.length > 0 &&
    bodyLines.every((line) => LIST_ITEM_PATTERN.test(line))
  );
};

export const stripNonNarrativeBlocks = (content: string): string => {
  if (!content) return '';

  const withoutContainers = content
    .replace(DETAILS_BLOCK_PATTERN, '\n')
    .replace(CONTAINER_TAG_PATTERN, '');

  const withoutScaffolding = withoutContainers
    .split('\n')
    .filter((line) => !isScaffoldingLine(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return withoutScaffolding
    .split(/\n{2,}/)
    .filter((block) => !isBookkeepingBlock(block))
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const comparableWords = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const wordBigrams = (words: string[]): string[] =>
  words.length < 2
    ? words
    : words.slice(0, -1).map((word, index) => `${word} ${words[index + 1]}`);

/**
 * Dice coefficient over word bigrams: an order-sensitive overlap score that
 * stands in for difflib's sequence ratio at a fraction of its cost, which
 * matters because this runs on the turn's write path.
 */
const similarityRatio = (left: string, right: string): number => {
  const leftGrams = wordBigrams(comparableWords(left));
  const rightGrams = wordBigrams(comparableWords(right));

  if (leftGrams.length === 0 || rightGrams.length === 0) {
    return left.trim() === right.trim() ? 1 : 0;
  }

  const remaining = new Map<string, number>();
  leftGrams.forEach((gram) => {
    remaining.set(gram, (remaining.get(gram) ?? 0) + 1);
  });

  let shared = 0;
  rightGrams.forEach((gram) => {
    const available = remaining.get(gram) ?? 0;
    if (available > 0) {
      shared += 1;
      remaining.set(gram, available - 1);
    }
  });

  return (2 * shared) / (leftGrams.length + rightGrams.length);
};

export const dedupeAgainstRecent = (
  content: string,
  recentContents: string[]
): string => {
  const shownParagraphs = recentContents
    .slice(-DEDUPE_WINDOW_SEGMENTS)
    .flatMap(splitParagraphs)
    .filter((paragraph) => paragraph.length >= MIN_COMPARABLE_LENGTH);

  if (shownParagraphs.length === 0) return content;

  const paragraphs = splitParagraphs(content);
  const kept = paragraphs.filter(
    (paragraph) =>
      paragraph.length < MIN_COMPARABLE_LENGTH ||
      !shownParagraphs.some(
        (shown) => similarityRatio(paragraph, shown) >= PARAGRAPH_MATCH_THRESHOLD
      )
  );

  if (kept.length === 0) return content;

  return kept.join('\n\n');
};

export const applyNarrativeContentGate = (
  content: string,
  recentContents: string[]
): string => {
  const stripped = stripNonNarrativeBlocks(content);
  if (!stripped) return content;

  return dedupeAgainstRecent(stripped, recentContents);
};
