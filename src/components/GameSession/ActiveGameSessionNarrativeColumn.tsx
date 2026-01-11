'use client';

import React from 'react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import type { EndingType } from '@/types/narrative.types';

interface ActiveGameSessionNarrativeColumnProps {
  controllerKey: string;
  worldId: string;
  sessionId: string;
  characterId?: string;
  decisionWeight?: Decision['decisionWeight'];
  triggerGeneration: boolean;
  initialized: boolean;
  shouldTriggerGeneration: boolean;
  localSelectedChoiceId?: string;
  selectedChoiceId?: string;
  onNarrativeGenerated: (segment: NarrativeSegment) => void;
  onChoicesGenerated: (decision: Decision) => void;
  onEndingSuggested: (reason: string, endingType: EndingType) => void;
  narrativeMaxHeight?: string;
  segmentCount: number;
}

const ActiveGameSessionNarrativeColumn: React.FC<ActiveGameSessionNarrativeColumnProps> = ({
  controllerKey,
  worldId,
  sessionId,
  characterId,
  decisionWeight,
  triggerGeneration,
  initialized,
  shouldTriggerGeneration,
  localSelectedChoiceId,
  selectedChoiceId,
  onNarrativeGenerated,
  onChoicesGenerated,
  onEndingSuggested,
  narrativeMaxHeight,
  segmentCount,
}) => {
  return (
    <div
      className="lg:flex-1 min-h-0 flex flex-col lg:overflow-hidden relative"
      id="narrative-container"
      style={narrativeMaxHeight ? { maxHeight: narrativeMaxHeight } : undefined}
    >
      {/* Fade-out overlay at top when multiple segments */}
      {segmentCount > 1 && (
        <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10 bg-gradient-to-b from-background to-transparent" />
      )}
      {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
      <NarrativeHistoryManager
        key={`display-${controllerKey}`}
        sessionId={sessionId}
        className="flex flex-col flex-1 min-h-0"
        disableInitialAutoScroll={false}
      />

      {/* Hidden controller just to generate content - always include it but hide from view */}
      <div aria-hidden="true" className="hidden h-0 overflow-hidden">
        <NarrativeController
          key={`generator-${controllerKey}`}
          worldId={worldId}
          sessionId={sessionId}
          characterId={characterId || undefined}
          decisionWeight={decisionWeight}
          triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration}
          choiceId={localSelectedChoiceId || selectedChoiceId}
          onNarrativeGenerated={onNarrativeGenerated}
          onChoicesGenerated={onChoicesGenerated}
          onEndingSuggested={onEndingSuggested}
          generateChoices={true}
        />
      </div>
    </div>
  );
};

export default ActiveGameSessionNarrativeColumn;
