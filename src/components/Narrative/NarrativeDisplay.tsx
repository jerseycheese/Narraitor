import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { cssClasses, parseNarrativeContent } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { PromptDebugSection } from './PromptDebugSection';
import { ChoiceOutcomeCallout } from './ChoiceOutcomeCallout';
import { useNPCStore } from '@/state/npcStore';
import { useDevTools } from '@/components/devtools/DevToolsContext';
import {
  deriveFallbackName,
  useNarrativeParticipants,
} from './useNarrativeParticipants';

interface NarrativeDisplayProps {
  segment: NarrativeSegment | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  segment,
  isLoading = false,
  error,
  onRetry
}) => {
  // Use selector to avoid subscribing to entire store
  const getById = useNPCStore((state) => state.getById);
  const { settings } = useDevTools();

  const getFormattingOptions = (type: string): FormattingOptions => {
    switch (type) {
      case 'dialogue':
        return { formatDialogue: true };
      case 'scene':
        return { formatDialogue: true, paragraphSpacing: 'double' };
      case 'transition':
        return { preserveLineBreaks: true };
      case 'action':
      default:
        return {}; // Use all defaults
    }
  };

  const resolvedSegment = segment ?? null;
  const segmentType = resolvedSegment?.type ?? 'scene';
  const isDialogue = segmentType === 'dialogue';

  const formattingOptions = getFormattingOptions(segmentType);
  const parsedContent = React.useMemo(
    () => (resolvedSegment ? parseNarrativeContent(resolvedSegment.content) : ''),
    [resolvedSegment]
  );
  const formattedContent = React.useMemo(
    () => formatAIResponse(parsedContent, formattingOptions),
    [parsedContent, formattingOptions]
  );

  const speakerId = resolvedSegment?.metadata?.speakerId;
  const speakerRecord = speakerId ? getById(speakerId) : null;
  const speakerName = speakerId
    ? (speakerRecord?.name ?? deriveFallbackName(speakerId))
    : null;

  const { participants, highlightTerms } = useNarrativeParticipants({
    segment: resolvedSegment,
    speakerId,
    speakerName,
    isDialogue,
    getById,
  });

  if (isLoading) {
    return (
      <div>
        <LoadingState message="Writing your story..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorDisplay
          variant="section"
          severity="error"
          title="Unable to Generate Narrative"
          message={error}
          showRetry={!!onRetry}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!resolvedSegment) {
    return null;
  }

  return (
    <article className="narrative-segment space-y-3">
      {/* Choice Outcome Callout (Issue #971) */}
      {resolvedSegment.metadata?.causedByDecisionId &&
        resolvedSegment.metadata?.causedByDecisionText && (
          <ChoiceOutcomeCallout
            decisionId={resolvedSegment.metadata.causedByDecisionId}
            decisionText={resolvedSegment.metadata.causedByDecisionText}
            decisionOutcome={resolvedSegment.metadata.decisionOutcome}
          />
        )}

      <FormattedNarrativeContent
        content={formattedContent}
        className={cssClasses(
          'readable',
          resolvedSegment.type === 'scene' ? 'scene-spacing' : '',
          resolvedSegment.type === 'dialogue' ? 'dialogue-segment' : '',
          resolvedSegment.type === 'transition' ? 'preserve-breaks' : ''
        )}
        highlightTerms={highlightTerms}
      />

      {/* Debug Information Section (dev mode only) */}
      {settings.showPromptDebugInfo && resolvedSegment.metadata?.debugInfo && (
        <PromptDebugSection debugInfo={resolvedSegment.metadata.debugInfo} />
      )}
    </article>
  );
};
