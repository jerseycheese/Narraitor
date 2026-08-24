'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Decision, DecisionRequirement, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { inferCustomActionSkillChecks } from '@/lib/ai/customActionSkillInference';
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
  setIsEvaluatingAction: Dispatch<SetStateAction<boolean>>;
  setLocalSelectedChoiceId: Dispatch<SetStateAction<string | undefined>>;
  choiceGenerationTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  scheduleChoiceFallback: () => void;
  onChoiceSelected: (choiceId: string) => void;
  autoSave: UseAutoSaveReturn;
  isSessionEnded: (sessionId: string) => boolean;
  createDecisionJournalEntry: (decision: Decision, selectedChoiceId: string, isCustomChoice: boolean) => void;
  createJournalEntryFromSegment: (segment: NarrativeSegment, relatedDecisionWeight?: 'minor' | 'major' | 'critical') => void;
}

/**
 * Encapsulates narrative + choice handlers while keeping state changes centralized.
 */
export const useActiveGameSessionActions = ({
  sessionId,
  characterId,
  currentDecision,
  setCurrentDecision,
  setIsGenerating,
  setShouldTriggerGeneration,
  setIsGeneratingChoices,
  setIsEvaluatingAction,
  setLocalSelectedChoiceId,
  choiceGenerationTimeoutRef,
  scheduleChoiceFallback,
  onChoiceSelected,
  autoSave,
  isSessionEnded,
  createDecisionJournalEntry,
  createJournalEntryFromSegment,
}: UseActiveGameSessionActionsOptions) => {
  const maybeCompleteFirstPlay = useCallback(() => {
    const sessionStore = useSessionStore.getState();
    if (sessionStore.shouldShowTutorialPhase?.('firstPlay')) {
      sessionStore.completeTutorialPhase('firstPlay');
    }
  }, []);

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

    scheduleChoiceFallback();

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

    maybeCompleteFirstPlay();
    onChoiceSelected(choiceId);

    void autoSave.triggerSave('player-choice');
  }, [autoSave, characterId, createDecisionJournalEntry, currentDecision, isSessionEnded, maybeCompleteFirstPlay, onChoiceSelected, sessionId, setCurrentDecision, setIsGenerating, setIsGeneratingChoices, setLocalSelectedChoiceId, setShouldTriggerGeneration]);

  const handleCustomSubmit = useCallback(async (customText: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }

    // Can't register a custom action without an active decision; bail before touching
    // generation state so we never fire onChoiceSelected with an id that backs no option.
    if (!currentDecision) {
      return;
    }

    // Handle custom player input
    const customChoiceId = generateUniqueId('custom');

    // Create decision journal entry for custom choice (Issue #174)
    if (currentDecision && characterId) {
      createDecisionJournalEntry(currentDecision, customText, true);
    }

    // Disable input immediately; the inference + roll happen before generation.
    // The choice id itself is published further down, once the option it names
    // exists on the decision: NarrativeController starts a turn the moment it
    // sees a new choice id, and reads that option's requirements to roll.
    setIsGenerating(true);
    setIsGeneratingChoices(true);

    // Phase 1 (Issue #918): infer skill checks for the typed action so custom
    // actions get the same d20 treatment as predefined choices. The resulting
    // requirements are attached to the option below; NarrativeController then
    // rolls them via its existing skill-check evaluation.
    let inferredRequirements: DecisionRequirement[] = [];
    if (currentDecision && characterId) {
      const character = useCharacterStore.getState().characters[characterId];
      const world = character
        ? useWorldStore.getState().worlds[character.worldId]
        : undefined;

      if (character && world) {
        setIsEvaluatingAction(true);
        try {
          const recentSegments = useNarrativeStore
            .getState()
            .getSessionSegments(sessionId)
            .slice(-2);
          inferredRequirements = await inferCustomActionSkillChecks({
            actionText: customText,
            character,
            world,
            recentSegments,
          });
        } finally {
          setIsEvaluatingAction(false);
        }
      }
    }

    // Create a custom decision option and add it to the current decision in the store
    if (currentDecision) {
      const customOption = {
        id: customChoiceId,
        text: customText,
        isCustomInput: true,
        customText: customText,
        ...(inferredRequirements.length > 0
          ? { requirements: inferredRequirements }
          : {}),
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
    setLocalSelectedChoiceId(customChoiceId);
    setShouldTriggerGeneration(true);

    maybeCompleteFirstPlay();
    onChoiceSelected(customChoiceId);

    void autoSave.triggerSave('player-choice');
  }, [autoSave, characterId, createDecisionJournalEntry, currentDecision, isSessionEnded, maybeCompleteFirstPlay, onChoiceSelected, sessionId, setCurrentDecision, setIsEvaluatingAction, setIsGenerating, setIsGeneratingChoices, setLocalSelectedChoiceId, setShouldTriggerGeneration]);

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
      // Dev-mode only (#1829 round 6) - dropped here, same as the store
      // call site in usePlayerChoices.ts, before a codex review caught it.
      debugInfo: decision.debugInfo,
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
