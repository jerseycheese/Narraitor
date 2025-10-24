import React from 'react';
import { DevToolsSection } from '../shared/DevToolsSection';
import { JsonViewer } from '../JsonViewer';
import { formatNumericScore, formatStringList } from '@/lib/utils';
import type { CurrentNarrativeContext } from '@/types/relevance.types';
import type { PlayerDecision } from '@/types/personalization.types';

interface DecisionDetailsProps {
  selectedDecision: {
    decision: PlayerDecision;
    score: {
      overallScore: number;
      metadata?: {
        daysSinceDecision?: number;
        matchedTags?: string[];
        impactCategory?: string;
      };
    };
  } | null;
  currentContext: CurrentNarrativeContext | null;
}

export const DecisionDetails: React.FC<DecisionDetailsProps> = ({
  selectedDecision,
  currentContext,
}) => {
  if (!selectedDecision) {
    return null;
  }

  return (
    <DevToolsSection title="Selected Decision Details">
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-900"
        data-testid="relevance-details"
      >
        <div className="space-y-2">
          <div>
            <div className="font-semibold">Prompt</div>
            <div>{selectedDecision.decision.prompt}</div>
          </div>
          <div>
            <div className="font-semibold">Choice</div>
            <div>{selectedDecision.decision.choiceText}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-semibold">Overall</div>
              <div>{formatNumericScore(selectedDecision.score.overallScore)}</div>
            </div>
            <div>
              <div className="font-semibold">Days since decision</div>
              <div>{selectedDecision.score.metadata?.daysSinceDecision ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">Matched tags</div>
              <div>{formatStringList(selectedDecision.score.metadata?.matchedTags)}</div>
            </div>
            <div>
              <div className="font-semibold">Impact category</div>
              <div>{selectedDecision.score.metadata?.impactCategory ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="font-semibold">Decision context</div>
            <JsonViewer data={selectedDecision.decision.context} className="bg-white" />
          </div>
          <div>
            <div className="font-semibold">Current narrative context</div>
            <JsonViewer data={currentContext ?? {}} className="bg-white" />
          </div>
        </div>
      </div>
    </DevToolsSection>
  );
};
