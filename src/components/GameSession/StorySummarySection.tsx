'use client';

import * as React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useStoryCheckpointManager } from './hooks/useStoryCheckpointManager';
import { useWorldStore } from '@/state/worldStore';
import { buildStoryFromCheckpoints } from '@/lib/narrative/storyCheckpointHelpers';

interface StorySummarySectionProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

export const StorySummarySection: React.FC<StorySummarySectionProps> = ({ worldId, sessionId, characterId }) => {
  useStoryCheckpointManager({ worldId, sessionId, characterId });
  const worldState = useWorldStore(state => worldId ? state.worldStates[worldId] : undefined);

  // Get all checkpoints for this session
  const checkpointsForSession = React.useMemo(
    () => (worldState?.storyCheckpoints ?? []).filter((checkpoint) => checkpoint.sessionId === sessionId),
    [worldState?.storyCheckpoints, sessionId],
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

  return (
    <section className="mt-6" data-testid="story-summary-section">
      <CollapsibleSection title="The Story So Far" initialCollapsed>
        <div>
          {summaryParagraphs.length > 0 ? (
            <div className="prose prose-gray dark:prose-invert">
              {summaryParagraphs.map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 32)}-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Your story will appear here once major events occur.
            </p>
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
};
