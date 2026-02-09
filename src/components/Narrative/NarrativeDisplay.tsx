import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { parseNarrativeContent } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { NarrativeCharacterAvatar } from './NarrativeCharacterAvatar';
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

  const getSegmentStyles = (type: string) => {
    switch (type) {
      case 'dialogue':
        return {
          container: '',
          text: '',
        };
      case 'action':
        return {
          container: '',
          text: '',
        };
      case 'decision':
        return {
          container: '',
          text: '',
        };
      case 'combat':
        return {
          container: '',
          text: '',
        };
      case 'exploration':
        return {
          container: '',
          text: '',
        };
      case 'resolution':
        return {
          container: '',
          text: '',
        };
      case 'character_interaction':
        return {
          container: '',
          text: '',
        };
      case 'revelation':
        return {
          container: '',
          text: '',
        };
      case '':
        return {
          container: '',
          text: '',
        };
      case 'scene':
      default:
        return {
          container: '',
          text: '',
        };
    }
  };


  const getFormattingOptions = (type: string): FormattingOptions => {
    switch (type) {
      case 'dialogue':
        return { formatDialogue: true };
      case 'scene':
        return { formatDialogue: true, paragraphSpacing: 'double' };
      case '':
        return { preserveLineBreaks: true };
      case 'action':
      default:
        return {}; // Use all defaults
    }
  };

  const resolvedSegment = segment ?? null;
  const segmentType = resolvedSegment?.type ?? 'scene';
  const isDialogue = segmentType === 'dialogue';

  const styles = getSegmentStyles(segmentType);
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
      <div >
        <LoadingState message="Writing your story..." theme="light" />
      </div>
    );
  }

  if (error) {
    return (
      <div >
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
    <div >
      <div className={`narrative-segment${styles.container}`}>
        {/* Choice Outcome Callout (Issue #971) */}
        {resolvedSegment.metadata?.causedByDecisionId &&
         resolvedSegment.metadata?.causedByDecisionText && (
          <div >
            <ChoiceOutcomeCallout
              decisionId={resolvedSegment.metadata.causedByDecisionId}
              decisionText={resolvedSegment.metadata.causedByDecisionText}
              decisionOutcome={resolvedSegment.metadata.decisionOutcome}
            />
          </div>
        )}

        {isDialogue && speakerId && speakerName && (
          <div >
            <NarrativeCharacterAvatar
              name={speakerName}
              avatarUrl={speakerRecord?.avatarUrl}
              size="sm"
            />
            <span >
              {speakerName}
            </span>
          </div>
        )}

        <FormattedNarrativeContent
          content={formattedContent}
          className={`narrative-content readable ${resolvedSegment.type === 'scene' ? 'scene-spacing' : ''} ${resolvedSegment.type === 'dialogue' ? 'dialogue-segment' : ''} ${resolvedSegment.type === '' ? 'preserve-breaks' : ''} ${styles.text}`}
          highlightTerms={highlightTerms}
        />
        {(participants.length > 0 || resolvedSegment.metadata?.location) && (
          <div >
            {resolvedSegment.metadata?.location && (
              <p >
                {resolvedSegment.metadata?.location}
              </p>
            )}
            {participants.length > 0 && (
              <div>
                <p >
                  Characters Present
                </p>
                <div
                  
                  role="list"
                  aria-label="Characters present in this scene"
                >
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      
                      role="listitem"
                    >
                      <NarrativeCharacterAvatar
                        name={participant.name}
                        avatarUrl={participant.avatarUrl}
                        size="sm"
                      />
                      <span >
                        {participant.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Information Section (dev mode only) */}
        {settings.showPromptDebugInfo && resolvedSegment.metadata?.debugInfo && (
          <PromptDebugSection debugInfo={resolvedSegment.metadata.debugInfo} />
        )}
      </div>
    </div>
  );
};
