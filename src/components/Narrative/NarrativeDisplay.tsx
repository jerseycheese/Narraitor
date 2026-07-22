import React, { useRef } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { clsx } from 'clsx';
import { parseNarrativeContent } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { PromptDebugSection } from './PromptDebugSection';
import { ChoiceOutcomeCallout } from './ChoiceOutcomeCallout';
import { TermDefinition } from './TermDefinition';
import { useTermDefinitions, TermDefinitionData } from './useTermDefinitions';
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

  const { highlightTerms } = useNarrativeParticipants({
    segment: resolvedSegment,
    speakerId,
    speakerName,
    isDialogue,
    getById,
  });

  // Marginalia term definitions (Issue #1058)
  const { termNames, getDefinition } = useTermDefinitions(
    resolvedSegment?.worldId,
    resolvedSegment?.sessionId
  );

  const [activeTerm, setActiveTerm] = React.useState<TermDefinitionData | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleTermClick = React.useCallback(
    (termText: string, anchorElement: HTMLElement) => {
      const definition = getDefinition(termText);
      if (definition) {
        triggerRef.current = anchorElement;
        setActiveTerm(definition);
      }
    },
    [getDefinition]
  );

  const handleTermDismiss = React.useCallback((shouldRestoreFocus = true) => {
    if (shouldRestoreFocus) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    triggerRef.current = null;
    setActiveTerm(null);
  }, []);

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
          title="The story paused"
          message={error}
          showRetry={!!onRetry}
          onRetry={onRetry}
          retryLabel="Continue the story"
        />
      </div>
    );
  }

  if (!resolvedSegment) {
    return null;
  }

  return (
    <article className="narrative-segment">
      {/* Choice Outcome Callout (Issue #971) */}
      {resolvedSegment.metadata?.causedByDecisionId &&
        resolvedSegment.metadata?.causedByDecisionText && (
          <ChoiceOutcomeCallout
            decisionId={resolvedSegment.metadata.causedByDecisionId}
            decisionText={resolvedSegment.metadata.causedByDecisionText}
            decisionOutcome={resolvedSegment.metadata.decisionOutcome}
          />
        )}

      {/* Rendered before the prose so the desktop margin note (align-self:
          flex-end) sits above it, matching the choice outcome callout.
          Mobile renders it as a bottom sheet via CSS (F41). */}
      {activeTerm && (
        <TermDefinition
          term={activeTerm}
          onDismiss={handleTermDismiss}
        />
      )}

      <FormattedNarrativeContent
        content={formattedContent}
        className={clsx(
          'readable',
          resolvedSegment.type === 'scene' ? 'scene-spacing' : '',
          resolvedSegment.type === 'dialogue' ? 'dialogue-segment' : '',
          resolvedSegment.type === 'transition' ? 'preserve-breaks' : ''
        )}
        highlightTerms={highlightTerms}
        definitionTerms={termNames}
        onTermClick={handleTermClick}
      />

      {/* Debug Information Section (dev mode only) */}
      {settings.showPromptDebugInfo && resolvedSegment.metadata?.debugInfo && (
        <PromptDebugSection debugInfo={resolvedSegment.metadata.debugInfo} />
      )}
    </article>
  );
};
