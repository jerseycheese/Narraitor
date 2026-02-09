'use client';

import { useCallback } from 'react';
import { useJournalStore } from '@/state/journalStore';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import { safeTrim, truncate, getTimestamp } from '@/lib/utils';

const YOU_PREFIX_REGEX = /^you\s+/i; // Remove leading "you" (case-insensitive) and following whitespace
const QUESTION_MARK_SUFFIX_REGEX = /\?$/; // Remove trailing question mark
const GENERIC_PROMPT_REGEX = /^what will you do(\b.*)?$/i;
const GENERIC_PROMPT_SUFFIX_REGEX = /(,?\s*)?(what (do|will) you do( next| now)?|how do you respond|what is your move|what's your move)\??\.?$/i;

interface UseActiveGameSessionJournalOptions {
  sessionId: string;
  worldId: string;
  characterId?: string;
}

/**
 * Builds journal entries for decisions and narrative segments.
 */
export const useActiveGameSessionJournal = ({
  sessionId,
  worldId,
  characterId,
}: UseActiveGameSessionJournalOptions) => {
  const { addEntry } = useJournalStore();

  const createFallbackSummary = useCallback((content: string): string => {
    // Extract first sentence and clean it up
    const sentences = content.split(/[.!?]+/).filter(s => safeTrim(s).length > 10);
    if (sentences.length > 0) {
      let summary = safeTrim(sentences[0]);
      // Convert from second person to past tense if needed
      summary = summary.replace(/^You\s+/, '').replace(/\byou\b/g, 'the character');
      // Keep it concise - max 60 characters
      return summary.length > 60 ? truncate(summary, 57) : summary + '.';
    }
    return 'Something happened in the adventure.';
  }, []);

  const generateJournalSummary = useCallback(async (
    content: string,
    type: string,
    location?: string,
    decisionWeight?: 'minor' | 'major' | 'critical'
  ): Promise<{ summary: string; entryType: string; significance: string }> => {
    try {
      const response = await fetch('/api/narrative/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          location,
          decisionWeight,
          instructions: 'Create a concise journal entry summary of what happened. Focus on key actions, discoveries, or events only. Avoid sensory details.',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary && data.entryType && data.significance) {
          return {
            summary: data.summary,
            entryType: data.entryType,
            significance: data.significance,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to generate AI summary for journal entry:', error);
    }

    // Return fallback values using decision weight for significance
    const fallbackSignificance = decisionWeight || 'minor';
    return {
      summary: createFallbackSummary(content),
      entryType: 'character_event',
      significance: fallbackSignificance,
    };
  }, [createFallbackSummary]);

  const createDecisionJournalEntry = useCallback((
    decision: Decision,
    selectedChoiceId: string,
    isCustomChoice: boolean
  ) => {
    if (!characterId) return;

    // Find the selected choice
    const selectedChoice = decision.options.find(option => option.id === selectedChoiceId);
    const choiceText = selectedChoice?.text || (isCustomChoice ? selectedChoiceId : 'Unknown choice');

    // Format decision content for readability
    const formatDecisionContent = (choice: string, prompt: string): string => {
      const cleanChoice = safeTrim(choice).replace(/[.!?]+$/, '').toLowerCase();
      const cleanPrompt = safeTrim(prompt)
        .replace(GENERIC_PROMPT_SUFFIX_REGEX, '')
        .replace(YOU_PREFIX_REGEX, '')
        .replace(QUESTION_MARK_SUFFIX_REGEX, '')
        .toLowerCase();

      if (!cleanPrompt || GENERIC_PROMPT_REGEX.test(cleanPrompt)) {
        return `Chose to${cleanChoice}.`;
      }

      return `Chose to${cleanChoice}when${cleanPrompt}.`;
    };

    // Map decision weight to significance
    const significance: 'minor' | 'major' | 'critical' = decision.decisionWeight || 'minor';

    try {
      addEntry(sessionId, {
        worldId: worldId,
        characterId: characterId,
        type: 'decision',
        title: '', // No title for MVP - content is sufficient
        content: formatDecisionContent(choiceText, decision.prompt),
        significance: significance,
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['decision'],
          automaticEntry: true,
          decisionId: decision.id,
          choiceText: choiceText,
          decisionPrompt: decision.prompt,
        },
        updatedAt: getTimestamp(),
      });
    } catch (error) {
      console.warn('Failed to create decision journal entry:', error);
    }
  }, [addEntry, characterId, sessionId, worldId]);

  const createJournalEntryFromSegment = useCallback((
    segment: NarrativeSegment,
    relatedDecisionWeight?: 'minor' | 'major' | 'critical'
  ) => {
    if (!characterId) return;

    const cleanContent = segment.content;
    const actualLocation = segment.metadata?.location;

    // Generate AI summary, type, and significance for journal entry (async)
    generateJournalSummary(cleanContent, segment.type, actualLocation, relatedDecisionWeight).then(aiResult => {
      try {
        addEntry(sessionId, {
          worldId: worldId,
          characterId: characterId,
          type: aiResult.entryType as 'character_event' | 'discovery' | 'achievement' | 'world_event' | 'relationship_change',
          title: '', // No title for MVP - content is sufficient
          content: aiResult.summary,
          significance: aiResult.significance as 'minor' | 'major' | 'critical',
          isRead: false, // Read status no longer used but kept for type compatibility
          relatedEntities: [],
          metadata: {
            tags: [segment.type],
            automaticEntry: true,
            narrativeSegmentId: segment.id,
          },
          updatedAt: getTimestamp(),
        });
      } catch (error) {
        console.warn('Failed to create journal entry from narrative segment:', error);
      }
    }).catch(error => {
      console.warn('Failed to generate journal summary, using fallback:', error);
      // Use fallback if AI completely fails
      try {
        const fallbackSignificance = relatedDecisionWeight || 'minor';
        const fallbackContent = createFallbackSummary(cleanContent);
        addEntry(sessionId, {
          worldId: worldId,
          characterId: characterId,
          type: 'character_event',
          title: '', // No title for MVP - content is sufficient
          content: fallbackContent,
          significance: fallbackSignificance,
          isRead: false, // Read status no longer used but kept for type compatibility
          relatedEntities: [],
          metadata: {
            tags: [segment.type],
            automaticEntry: true,
            narrativeSegmentId: segment.id,
          },
          updatedAt: getTimestamp(),
        });
      } catch (fallbackError) {
        console.warn('Failed to create fallback journal entry:', fallbackError);
      }
    });
  }, [addEntry, characterId, createFallbackSummary, generateJournalSummary, sessionId, worldId]);

  return {
    createDecisionJournalEntry,
    createJournalEntryFromSegment,
  };
};
