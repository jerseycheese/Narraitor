'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EndingTone, EndingType } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import type { StoreCharacter } from '@/state/characterStore';

import Logger from '@/lib/utils/logger';
const logger = new Logger('UseActiveGameSessionEnding');

interface UseActiveGameSessionEndingOptions {
  sessionId: string;
  characterId?: string;
  world?: World;
  character?: StoreCharacter;
  generateEnding: (
    endingType: EndingType,
    options: {
      sessionId: string;
      characterId: string;
      worldId: string;
      desiredTone?: EndingTone;
      customPrompt?: string;
      world?: World;
      character?: StoreCharacter;
    }
  ) => Promise<void>;
}

/**
 * Owns ending suggestion state and confirmation flows.
 */
export const useActiveGameSessionEnding = ({
  sessionId,
  characterId,
  world,
  character,
  generateEnding,
}: UseActiveGameSessionEndingOptions) => {
  const [showEndingSuggestion, setShowEndingSuggestion] = useState(false);
  const [endingSuggestionReason, setEndingSuggestionReason] = useState('');
  const [suggestedEndingType, setSuggestedEndingType] = useState<EndingType>('story-complete');
  const [isFatalEnding, setIsFatalEnding] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const fatalEndingTriggeredRef = useRef(false);

  // Reset fatal guard and flag when session changes
  useEffect(() => {
    fatalEndingTriggeredRef.current = false;
    setIsFatalEnding(false);
  }, [sessionId]);

  const handleEndStory = useCallback(async () => {
    if (!characterId || !world || !character) return;

    // Manual endings are never fatal
    setIsFatalEnding(false);

    try {
      await generateEnding('player-choice', {
        sessionId,
        characterId,
        worldId: world.id,
        world: world,
        character: character,
      });
    } catch (error) {
      logger.error('Failed to load ending:', error);
    }
  }, [character, characterId, generateEnding, sessionId, world]);

  const handleEndingSuggested = useCallback((reason: string, endingType: EndingType) => {
    setEndingSuggestionReason(reason);
    setSuggestedEndingType(endingType);

    const isFatal = reason.toLowerCase().startsWith('fatal:');

    // Set fatal ending flag for loader text
    setIsFatalEnding(isFatal);

    if (isFatal && !fatalEndingTriggeredRef.current) {
      fatalEndingTriggeredRef.current = true;

      if (!characterId || !world || !character) {
        setShowEndingSuggestion(true);
        return;
      }

      void generateEnding(endingType, {
        sessionId,
        characterId,
        worldId: world.id,
        world: world,
        character: character,
        desiredTone: 'tragic',
      }).catch((error) => {
        logger.error('Failed to auto-generate fatal ending:', error);
        setShowEndingSuggestion(true);
        fatalEndingTriggeredRef.current = false;
      });
      return;
    }

    setShowEndingSuggestion(true);
  }, [character, characterId, generateEnding, sessionId, world]);

  const handleAcceptEndingSuggestion = useCallback(async () => {
    setShowEndingSuggestion(false);
    if (!characterId || !world || !character) return;

    try {
      await generateEnding(suggestedEndingType, {
        sessionId,
        characterId,
        worldId: world.id,
        world: world,
        character: character,
      });
    } catch (error) {
      logger.error('Failed to load ending:', error);
    }
  }, [character, characterId, generateEnding, sessionId, suggestedEndingType, world]);

  const handleRejectEndingSuggestion = useCallback(() => {
    setShowEndingSuggestion(false);
    setIsFatalEnding(false); // Reset fatal flag when suggestion dismissed
  }, []);

  const handleEndStoryClick = useCallback(() => {
    setShowEndConfirmation(true);
  }, []);

  const handleConfirmEndStory = useCallback(() => {
    setShowEndConfirmation(false);
    void handleEndStory();
  }, [handleEndStory]);

  const handleCloseEndStory = useCallback(() => {
    setShowEndConfirmation(false);
  }, []);

  return {
    showEndingSuggestion,
    endingSuggestionReason,
    isFatalEnding,
    showEndConfirmation,
    handleEndingSuggested,
    handleAcceptEndingSuggestion,
    handleRejectEndingSuggestion,
    handleEndStoryClick,
    handleConfirmEndStory,
    handleCloseEndStory,
  };
};
