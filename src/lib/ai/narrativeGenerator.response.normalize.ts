import { normalizeText, NORM_DESC } from '@/lib/utils/textNormalization';
import { safeTrim } from '@/lib/utils';
import type { NarrativeExtractedMetadata } from './narrativeGenerator.response.types';

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
      .replace(/\s*\[metadata\.[a-z]+:\s*[a-z0-9-]+\]/gi, '');
  }

  return normalizedContent;
};
