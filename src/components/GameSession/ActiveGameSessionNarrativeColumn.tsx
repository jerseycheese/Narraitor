'use client';

import React from 'react';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import type { Decision, NarrativeSegment, EndingType } from '@/types/narrative.types';

interface ActiveGameSessionNarrativeColumnProps {
  sessionId: string;
  segmentCount: number;
  controllerKey?: string;
  worldId?: string;
  characterId?: string;
  decisionWeight?: Decision['decisionWeight'];
  triggerGeneration?: boolean;
  initialized?: boolean;
  shouldTriggerGeneration?: boolean;
  localSelectedChoiceId?: string;
  selectedChoiceId?: string;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  onChoicesGenerated?: (decision: Decision) => void;
  onEndingSuggested?: (reason: string, endingType: EndingType) => void;
  retryToken?: number;
  /** See NarrativeHistoryManager's isGenerating/streamingContent (issue #1476). */
  isGenerating?: boolean;
  streamingContent?: string;
  onStreamingPreviewChange?: (preview: string) => void;
}

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
      {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
      <NarrativeHistoryManager
        key={`display-${controllerKey || sessionId}`}
        sessionId={sessionId}
        disableInitialAutoScroll={false}
        isGenerating={isGenerating}
        streamingContent={streamingContent}
      />
    </div>
  );
};

export default ActiveGameSessionNarrativeColumn;
