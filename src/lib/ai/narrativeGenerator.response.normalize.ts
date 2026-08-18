import { normalizeText, NORM_DESC } from '@/lib/utils/textNormalization';
import { safeTrim } from '@/lib/utils';
import type { NarrativeExtractedMetadata } from './narrativeGenerator.response.types';

/**
 * Bare HTML the model sometimes reaches for instead of markdown. The prose
 * renderer only understands markdown, so the tag lands in front of the player
 * as literal text.
 */
const HTML_TAG_PATTERN =
  /<\/?(?:br|p|div|span|hr|em|strong|b|i|u|ul|ol|li|blockquote|pre|h[1-6])(?:\s[^<>]*)?\/?>/gi;

/**
 * A final paragraph that is bold end to end - the shape a stage direction takes
 * when the model signs off about the story instead of staying inside it.
 */
const BOLD_CLOSING_PARAGRAPH_PATTERN = /(?:\n\s*)+\*\*([^*]+)\*\*\s*$/;

/**
 * Narrow on purpose: the narrative has to be the paragraph's own subject with the
 * verb right behind it. Emphatic in-fiction closers survive, including ones that
 * mention the story in passing ("the story of the mill will continue to haunt
 * them"), where that verb belongs to a different subject.
 */
const META_COMMENTARY_PATTERN =
  /^(?:the|this)\s+(?:narrative|story|scene|segment|chapter|passage)\s+(?:will\s+(?:continue|resume|proceed|pick\s+up)|continues|resumes|picks\s+up)\b/i;

export const normalizeNarrativeContent = (
  content: string,
  extractedMetadata: NarrativeExtractedMetadata
): string => {
  let normalizedContent = normalizeText(content, NORM_DESC);

  if (
    extractedMetadata.characters &&
    extractedMetadata.characters.length > 0 &&
    normalizedContent
  ) {
    const escapeRegExp = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    extractedMetadata.characters.forEach((character) => {
      if (!character?.id) return;
      const tokenRegex = new RegExp(`\\[${escapeRegExp(character.id)}\\]`, 'g');
      const displayName = safeTrim(character.name) || character.id;
      const firstToken = displayName.split(/[\s,]+/)[0]?.toLowerCase();
      const canonicalDisplayName = displayName
        .replace(/[“”"‘’'`´]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const normalizedDisplayName = canonicalDisplayName
        .replace(/[^0-9a-z\s]/gi, '')
        .toLowerCase();

      normalizedContent = normalizedContent.replace(
        tokenRegex,
        (match, offset, fullString) => {
          const precedingRaw = fullString.slice(0, offset);
          const precedingTrimmed = precedingRaw.trimEnd();
          const after = fullString.slice(offset + match.length);
          const afterTrimmed = after.trimStart();

          if (normalizedDisplayName.length === 0) {
            return '';
          }

          const tailSlice = precedingTrimmed.slice(
            Math.max(0, precedingTrimmed.length - displayName.length - 3)
          );
          const normalizedTailCanonical = tailSlice
            .replace(/[“”"‘’'`´]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          const normalizedTail = normalizedTailCanonical
            .replace(/[^0-9a-z\s]/gi, '')
            .toLowerCase();

          const precedingLower = precedingTrimmed.toLowerCase();
          const canonicalLower = canonicalDisplayName.toLowerCase();
          if (
            precedingLower.endsWith(canonicalLower) ||
            precedingLower.endsWith(`${canonicalLower}'s`) ||
            precedingLower.endsWith(`${canonicalLower}’s`)
          ) {
            return '';
          }

          if (normalizedTail.endsWith(normalizedDisplayName)) {
            const afterLower = afterTrimmed
              .replace(/\s+/g, ' ')
              .trimStart()
              .toLowerCase();

            if (
              afterLower.startsWith("'s") ||
              afterLower.startsWith('’s') ||
              afterLower.startsWith("'") ||
              afterLower.startsWith('’')
            ) {
              return '';
            }

            return '';
          }

          if (firstToken) {
            const precedingWordMatch = precedingTrimmed.match(
              /([A-Za-zÀ-ÖØ-öø-ÿ’']+)[,;:]?$/
            );
            const precedingWord = precedingWordMatch?.[1];

            if (precedingWord) {
              const normalizedPrecedingWord = precedingWord
                .replace(/['’]s$/i, '')
                .replace(/[^0-9A-Za-z]/g, '')
                .toLowerCase();

              const normalizedFirstToken = firstToken.replace(/[^0-9A-Za-z]/g, '');

              if (
                normalizedPrecedingWord &&
                normalizedFirstToken &&
                normalizedPrecedingWord === normalizedFirstToken
              ) {
                return '';
              }
            }
          }

          if (
            normalizedTail.endsWith(normalizedDisplayName) &&
            afterTrimmed.trimStart().length === 0
          ) {
            return '';
          }

          const precedingChar = precedingTrimmed.slice(-1);
          if (afterTrimmed.length === 0 && ['.', '!', '?'].includes(precedingChar)) {
            return '';
          }

          return displayName;
        }
      );
    });
  }

  if (normalizedContent) {
    normalizedContent = normalizedContent
      .replace(/[ \t]+([,;:.!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s*\[[a-z0-9-]+\]/gi, '')
      .replace(/\s*\[metadata\.[a-z]+:\s*[a-z0-9-]+\]/gi, '')
      .replace(HTML_TAG_PATTERN, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(BOLD_CLOSING_PARAGRAPH_PATTERN, (match, statement: string) =>
        META_COMMENTARY_PATTERN.test(statement.trim()) ? '' : match
      )
      .trim();
  }

  return normalizedContent;
};
