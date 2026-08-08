'use client';

import * as React from 'react';
import { useStoryCheckpointManager } from './hooks/useStoryCheckpointManager';
import { useWorldStore } from '@/state/worldStore';
import { buildStoryFromCheckpoints } from '@/lib/narrative/storyCheckpointHelpers';

interface StorySummarySectionProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

export const StorySummarySection: React.FC<StorySummarySectionProps> = ({
  worldId,
  sessionId,
  characterId,
}) => {
  const { status, error } = useStoryCheckpointManager({ worldId, sessionId, characterId });
  const worldState = useWorldStore((state) =>
    worldId ? state.worldStates[worldId] : undefined
  );

  // Get all checkpoints for this session
  const checkpointsForSession = React.useMemo(
    () =>
      (worldState?.storyCheckpoints ?? []).filter(
        (checkpoint) => checkpoint.sessionId === sessionId
      ),
    [worldState?.storyCheckpoints, sessionId]
  );

  // Build complete story from all segments
  const fullStory = React.useMemo(
    () => buildStoryFromCheckpoints(checkpointsForSession),
    [checkpointsForSession]
  );

  // Split full story into paragraphs
  const summaryParagraphs = fullStory
    ? fullStory
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  const showFailedState = summaryParagraphs.length === 0 && status === 'error';

  return (
    <section
      data-testid="story-summary-section"
      className="manuscript-story-summary"
    >
      {summaryParagraphs.length > 0 ? (
        <div className="manuscript-story-summary-body">
          {summaryParagraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 32)}-${index}`} className="manuscript-story-summary-paragraph">{paragraph}</p>
          ))}
        </div>
      ) : showFailedState ? (
        <p className="manuscript-story-summary-error">
          {error ?? "Couldn't put together a story summary yet."}
        </p>
      ) : (
        <p className="manuscript-story-summary-empty">
          Your story will appear here once major events occur.
        </p>
      )}
    </section>
  );
};
