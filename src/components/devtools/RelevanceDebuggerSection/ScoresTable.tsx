import React from 'react';
import { DevToolsSection } from '../shared/DevToolsSection';
import { cn } from '@/lib/utils/classNames';
import { formatNumericScore } from '@/lib/utils';
import type { DecisionRelevanceResult } from '@/types/relevance.types';
import type { PlayerDecision } from '@/types/personalization.types';

type ScoreColumnKey =
  | 'overallScore'
  | 'recencyScore'
  | 'contextScore'
  | 'impactScore'
  | 'tagMatchScore'
  | 'characterScore';

const SCORE_COLUMNS: Array<{ key: ScoreColumnKey; label: string }> = [
  { key: 'overallScore', label: 'Overall' },
  { key: 'recencyScore', label: 'Recency' },
  { key: 'contextScore', label: 'Context' },
  { key: 'impactScore', label: 'Impact' },
  { key: 'tagMatchScore', label: 'Tags' },
  { key: 'characterScore', label: 'Characters' },
];

interface ScoresTableProps {
  analysis: DecisionRelevanceResult | null;
  topDecisions: Array<{
    decision: PlayerDecision;
    score: {
      decisionId: string;
      overallScore: number;
      recencyScore: number;
      contextScore: number;
      impactScore: number;
      tagMatchScore: number;
      characterScore: number;
      calculatedAt: string;
      metadata?: {
        daysSinceDecision?: number;
        matchedTags?: string[];
        contextSimilarity?: number;
        impactCategory?: string;
      };
    };
  }>;
  selectedDecisionId: string | null;
  onSelectDecision: (decisionId: string) => void;
  filteredDecisionsCount: number;
}

export const ScoresTable: React.FC<ScoresTableProps> = ({
  analysis,
  topDecisions,
  selectedDecisionId,
  onSelectDecision,
  filteredDecisionsCount,
}) => {
  return (
    <DevToolsSection title="Relevance Scores">
      {analysis ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-900 mb-3">
            <div data-testid="relevance-summary-total">
              <div className="font-semibold text-sm">Total decisions</div>
              <div>{analysis.totalDecisions}</div>
            </div>
            <div data-testid="relevance-summary-relevant">
              <div className="font-semibold text-sm">Above threshold</div>
              <div>{analysis.relevantDecisions}</div>
            </div>
            <div data-testid="relevance-summary-average">
              <div className="font-semibold text-sm">Average score</div>
              <div>{formatNumericScore(analysis.averageScore)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full border border-gray-300 text-xs"
              data-testid="relevance-scores-table"
            >
              <thead className="bg-gray-200 text-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left">Decision</th>
                  {SCORE_COLUMNS.map((column) => (
                    <th key={column.key as string} className="px-3 py-2 text-right">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topDecisions.map(({ decision, score }) => {
                  const isSelected = decision.id === selectedDecisionId;
                  return (
                    <tr
                      key={decision.id}
                      className={cn(
                        'border-t border-gray-200 cursor-pointer hover:bg-gray-200',
                        isSelected && 'bg-gray-300'
                      )}
                      onClick={() => onSelectDecision(decision.id)}
                      data-testid={`relevance-row-${decision.id}`}
                    >
                      <td className="px-3 py-2 text-gray-900">
                        <div className="font-medium">{decision.prompt}</div>
                        <div className="text-gray-700">{decision.choiceText}</div>
                      </td>
                      {SCORE_COLUMNS.map((column) => (
                        <td key={column.key as string} className="px-3 py-2 text-right">
                          {formatNumericScore(score[column.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-xs text-gray-700">
          {filteredDecisionsCount === 0
            ? 'No decisions available for the selected scope yet.'
            : 'Waiting for context data. Refresh once the session has narrative segments.'}
        </div>
      )}
    </DevToolsSection>
  );
};
