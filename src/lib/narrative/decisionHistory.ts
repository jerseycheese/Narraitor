import type { Decision, DecisionHistoryEntry, NarrativeSegment } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';

interface BuildDecisionHistoryParams {
  decisions: Decision[];
  segments: NarrativeSegment[];
}

const toTimestamp = (value?: string | Date): number => {
  if (!value) return Number.NaN;
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

export const buildDecisionHistory = ({
  decisions,
  segments,
}: BuildDecisionHistoryParams): DecisionHistoryEntry[] => {
  if (!decisions.length) return [];

  const selectedDecisions = decisions.filter((decision) => decision.selectedOptionId);
  if (!selectedDecisions.length) return [];

  const sortedSegments = [...segments].sort((a, b) => {
    const aTime = toTimestamp(a.createdAt);
    const bTime = toTimestamp(b.createdAt);
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return aTime - bTime;
  });

  const firstOutcomeByDecision = new Map<EntityID, NarrativeSegment>();
  sortedSegments.forEach((segment) => {
    const decisionId = segment.metadata?.causedByDecisionId;
    if (decisionId && !firstOutcomeByDecision.has(decisionId)) {
      firstOutcomeByDecision.set(decisionId, segment);
    }
  });

  return selectedDecisions.map((decision) => ({
    decision,
    outcomeSegment: firstOutcomeByDecision.get(decision.id),
  }));
};
