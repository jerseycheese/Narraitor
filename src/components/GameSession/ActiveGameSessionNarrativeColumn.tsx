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
  segmentCount: number;
}

const ActiveGameSessionNarrativeColumn: React.FC<
  ActiveGameSessionNarrativeColumnProps
> = ({
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
  segmentCount,
}) => {
  return (
    <div
      id="narrative-container"
      data-tutorial="narrative-display"
      className="w-full"
    >
      {/* Fade-out overlay at top when multiple segments */}
      {segmentCount > 1 && <div />}
      {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
      <NarrativeHistoryManager
        key={`display-${controllerKey}`}
        sessionId={sessionId}
        disableInitialAutoScroll={false}
      />

      {/* Hidden controller just to generate content - always include it but hide from view */}
      <div aria-hidden="true">
        <NarrativeController
          key={`generator-${controllerKey}`}
          worldId={worldId}
          sessionId={sessionId}
          characterId={characterId || undefined}
          decisionWeight={decisionWeight}
          triggerGeneration={
            triggerGeneration || !initialized || shouldTriggerGeneration
          }
          choiceId={localSelectedChoiceId || selectedChoiceId}
          onNarrativeGenerated={onNarrativeGenerated}
          onChoicesGenerated={onChoicesGenerated}
          onEndingSuggested={onEndingSuggested}
          generateChoices={true}
          hideHistory={true}
        />
      </div>
    </div>
  );
};

export default ActiveGameSessionNarrativeColumn;
