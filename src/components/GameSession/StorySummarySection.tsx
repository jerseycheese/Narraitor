'use client';

import * as React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useStoryCheckpointManager } from './hooks/useStoryCheckpointManager';
import { formatRelativeTime } from '@/lib/utils';

interface StorySummarySectionProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

export const StorySummarySection: React.FC<StorySummarySectionProps> = ({ worldId, sessionId, characterId }) => {
  const { latestCheckpoint } = useStoryCheckpointManager({ worldId, sessionId, characterId });

  const lastUpdatedLabel = latestCheckpoint?.createdAt
    ? formatRelativeTime(latestCheckpoint.createdAt)
    : null;

  return (
    <section className="mt-6" data-testid="story-summary-section">
      <CollapsibleSection title="The Story So Far" initialCollapsed>
        <div>
          {lastUpdatedLabel && (
            <div className="text-xs text-gray-500 mb-2">Updated {lastUpdatedLabel}</div>
          )}
          {latestCheckpoint ? (
            <p className="text-sm text-gray-800 leading-relaxed">{latestCheckpoint.summary}</p>
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
