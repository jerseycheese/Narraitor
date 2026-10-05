import { useEffect } from 'react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useStoryCheckpointManager } from '@/components/GameSession/hooks/useStoryCheckpointManager';
import { SessionBreakPrompt } from './SessionBreakPrompt';

export interface ChapterHandoffPromptProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

/** Keeps the next action blocked until the persisted recap is available. */
export const ChapterHandoffPrompt = ({
  worldId,
  sessionId,
  characterId,
}: ChapterHandoffPromptProps) => {
  const latest = useNarrativeStore((state) => {
    const segmentId = state.sessionSegments[sessionId]?.at(-1);
    return segmentId ? state.segments[segmentId] : undefined;
  });
  const hasHydrated = useNarrativeStore((state) => state._hasHydrated);
  const { createCheckpoint } = useStoryCheckpointManager({
    worldId,
    sessionId,
    characterId,
  });
  const chapter = latest?.metadata.chapter;
  useEffect(() => {
    if (hasHydrated && latest && chapter && !chapter.recap)
      void createCheckpoint(latest);
  }, [hasHydrated, latest, chapter, createCheckpoint]);
  if (!latest || !chapter || chapter.continued) return null;
  return (
    <SessionBreakPrompt
      isOpen
      className="chapter-handoff-prompt"
      chapterNumber={chapter.number}
      chapterRecap={chapter.recap}
      onDismiss={() => useNarrativeStore.getState().continueChapter(latest.id)}
    />
  );
};
