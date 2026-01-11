'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { generateUniqueId } from '@/lib/utils';
import type { UseAutoSaveReturn } from '@/hooks/useAutoSave';

interface UseActiveGameSessionActionsOptions {
  sessionId: string;
  characterId?: string;
  currentDecision: Decision | null;
  setCurrentDecision: Dispatch<SetStateAction<Decision | null>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setShouldTriggerGeneration: Dispatch<SetStateAction<boolean>>;
  setIsGeneratingChoices: Dispatch<SetStateAction<boolean>>;
  setLocalSelectedChoiceId: Dispatch<SetStateAction<string | undefined>>;
  choiceGenerationTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  scheduleChoiceFallback: (decisionAtSchedule: Decision | null) => void;
  onChoiceSelected: (choiceId: string) => void;
  autoSave: UseAutoSaveReturn;
  isSessionEnded: (sessionId: string) => boolean;
  createDecisionJournalEntry: (decision: Decision, selectedChoiceId: string, isCustomChoice: boolean) => void;
  createJournalEntryFromSegment: (segment: NarrativeSegment, relatedDecisionWeight?: 'minor' | 'major' | 'critical') => void;
}

export const useActiveGameSessionActions = ({
  sessionId,
  characterId,
  currentDecision,
  setCurrentDecision,
  setIsGenerating,
  setShouldTriggerGeneration,
  setIsGeneratingChoices,
  setLocalSelectedChoiceId,
  choiceGenerationTimeoutRef,
  scheduleChoiceFallback,
  onChoiceSelected,
  autoSave,
  isSessionEnded,
  createDecisionJournalEntry,
  createJournalEntryFromSegment,
}: UseActiveGameSessionActionsOptions) => {
  const handleNarrativeGenerated = useCallback((segment: NarrativeSegment) => {
    // Narrative segment was successfully generated
    setIsGenerating(false);
    setShouldTriggerGeneration(false); // Reset trigger
    // Start generating choices
    setIsGeneratingChoices(true);

    // Auto-create journal entry for significant narrative events
    if (characterId && segment.content) {
      // Use the current decision weight to determine journal significance
      const decisionWeight = currentDecision?.decisionWeight;
      createJournalEntryFromSegment(segment, decisionWeight);
    }

    scheduleChoiceFallback(currentDecision);

    void autoSave.triggerSave('scene-change');
  }, [autoSave, characterId, createJournalEntryFromSegment, currentDecision, scheduleChoiceFallback, setIsGenerating, setIsGeneratingChoices, setShouldTriggerGeneration]);

  const handleChoiceSelected = useCallback((choiceId: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }

    // Player choice was selected
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(choiceId);
    setShouldTriggerGeneration(true); // Trigger narrative generation

    // Create decision journal entry (Issue #174)
    if (currentDecision && characterId) {
      createDecisionJournalEntry(currentDecision, choiceId, false);
    }

    // If we have a current decision, update its selected option
    if (currentDecision) {
      useNarrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId, characterId || undefined);
    }

    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);

    onChoiceSelected(choiceId);

    void autoSave.triggerSave('player-choice');
  }, [autoSave, characterId, createDecisionJournalEntry, currentDecision, isSessionEnded, onChoiceSelected, sessionId, setCurrentDecision, setIsGenerating, setIsGeneratingChoices, setLocalSelectedChoiceId, setShouldTriggerGeneration]);

  const handleCustomSubmit = useCallback((customText: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }

    // Handle custom player input
    const customChoiceId = generateUniqueId('custom');

    // Create decision journal entry for custom choice (Issue #174)
    if (currentDecision && characterId) {
      createDecisionJournalEntry(currentDecision, customText, true);
    }

    // Create a custom decision option and add it to the current decision in the store
    if (currentDecision) {
      const customOption = {
        id: customChoiceId,
        text: customText,
        isCustomInput: true,
        customText: customText,
      };

      // Update the decision in the store with the new custom option and select it
      useNarrativeStore.getState().updateDecision(currentDecision.id, {
        options: [...currentDecision.options, customOption],
        selectedOptionId: customChoiceId,
      });
    }

    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);

    // Trigger narrative generation with the custom choice
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(customChoiceId);
    setShouldTriggerGeneration(true);

    onChoiceSelected(customChoiceId);

    void autoSave.triggerSave('player-choice');
  }, [autoSave, characterId, createDecisionJournalEntry, currentDecision, isSessionEnded, onChoiceSelected, sessionId, setCurrentDecision, setIsGenerating, setIsGeneratingChoices, setLocalSelectedChoiceId, setShouldTriggerGeneration]);

  const handleChoicesGenerated = useCallback((decision: Decision) => {
    if (!decision || !decision.options || (decision.options?.length || 0) === 0) {
      setIsGeneratingChoices(false);
      return;
    }

    // Clear the fallback timeout since we have real AI choices
    if (choiceGenerationTimeoutRef.current) {
      clearTimeout(choiceGenerationTimeoutRef.current);
      choiceGenerationTimeoutRef.current = null;
    }

    // Force update with a new object reference to ensure React detects the change
    const decisionCopy: Decision = {
      id: decision.id,
      prompt: decision.prompt,
      options: [...decision.options],
      selectedOptionId: decision.selectedOptionId,
      decisionWeight: decision.decisionWeight,
      contextSummary: decision.contextSummary,
    };

    // Update the current decision state with the copy
    setCurrentDecision(decisionCopy);
    // Stop the choice generation loading state
    setIsGeneratingChoices(false);

    // Convert AI-generated decision to player choices format for the session
    const playerChoices = decision.options.map(option => ({
      id: option.id,
      text: option.text,
      isSelected: option.id === decision.selectedOptionId,
    }));

    // Update session store with AI-generated choices
    useSessionStore.getState().setPlayerChoices(playerChoices);
  }, [choiceGenerationTimeoutRef, setCurrentDecision, setIsGeneratingChoices]);

  return {
    handleNarrativeGenerated,
    handleChoiceSelected,
    handleCustomSubmit,
    handleChoicesGenerated,
  };
};
