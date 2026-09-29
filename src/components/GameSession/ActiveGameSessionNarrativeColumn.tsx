'use client';

import React from 'react';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';

interface ActiveGameSessionNarrativeColumnProps {
  controllerKey: string;
  sessionId: string;
  segmentCount: number;
  /** See NarrativeHistoryManager's isGenerating/streamingContent (issue #1476). */
  isGenerating?: boolean;
  streamingContent?: string;
}

/**
 * Displays the narrative. Generation is driven by the single NarrativeController
 * that ActiveGameSession keeps mounted for the whole session.
 */
const ActiveGameSessionNarrativeColumn: React.FC<
  ActiveGameSessionNarrativeColumnProps
> = ({
  controllerKey,
  sessionId,
  segmentCount,
  isGenerating,
  streamingContent,
}) => {
  return (
    <div
      id="narrative-container"
      data-tutorial="narrative-display"
      className="manuscript-narrative-container"
    >
      {/* Fade-out overlay at top when multiple segments */}
      {segmentCount > 1 && <div />}
      <NarrativeHistoryManager
        key={`display-${controllerKey}`}
        sessionId={sessionId}
        disableInitialAutoScroll={false}
        isGenerating={isGenerating}
        streamingContent={streamingContent}
      />
    </div>
  );
};

export default ActiveGameSessionNarrativeColumn;
