import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { parseNarrativeContent } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { NarrativeCharacterAvatar } from './NarrativeCharacterAvatar';
import { useNPCStore } from '@/state/npcStore';
import {
  deriveFallbackName,
  useNarrativeParticipants,
} from './useNarrativeParticipants';

interface NarrativeDisplayProps {
  segment: NarrativeSegment | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Enable progressive disclosure with text chunking */
  enableChunking?: boolean;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  segment,
  isLoading = false,
  error,
  onRetry,
  enableChunking = false
}) => {
  // Use selector to avoid subscribing to entire store
  const getById = useNPCStore((state) => state.getById);

  const getSegmentStyles = (type: string) => {
    switch (type) {
      case 'dialogue':
        return {
          container: 'border-l-4 border-blue-500 bg-blue-100',
          text: 'italic text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'action':
        return {
          container: 'border-2 border-amber-500 bg-amber-200',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-amber-700 font-semibold mb-2'
        };
      case 'decision':
        return {
          container: 'border-2 border-blue-500 bg-blue-100',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'combat':
        return {
          container: 'border-2 border-red-500 bg-red-200',
          text: 'font-bold text-gray-900',
          label: 'text-xs uppercase text-red-700 font-semibold mb-2'
        };
      case 'exploration':
        return {
          container: 'border-2 border-green-500 bg-green-200',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-green-700 font-semibold mb-2'
        };
      case 'resolution':
        return {
          container: 'border-2 border-blue-500 bg-blue-100',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'character_interaction':
        return {
          container: 'border-2 border-blue-500 bg-blue-100',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'revelation':
        return {
          container: 'border-2 border-red-500 bg-red-200',
          text: 'font-medium italic text-gray-900',
          label: 'text-xs uppercase text-red-700 font-semibold mb-2'
        };
      case 'transition':
        return {
          container: 'bg-gray-100 border border-gray-300',
          text: 'text-gray-700 text-sm italic',
          label: 'text-xs uppercase text-gray-700 font-semibold mb-2'
        };
      case 'scene':
      default:
        return {
          container: 'bg-white border border-gray-300',
          text: 'text-gray-900',
          label: 'text-xs uppercase text-gray-700 font-semibold mb-2'
        };
    }
  };


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
      <div className="p-8 snap-center">
        <LoadingState message="Writing your story..." theme="light" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="snap-center">
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
    <div className="space-y-3 snap-center">
      <div className={`narrative-segment p-6 rounded-lg ${styles.container}`}>
        <p className={styles.label}>{resolvedSegment.type}</p>

        {participants.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Characters Present
            </p>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="list"
              aria-label="Characters present in this scene"
            >
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1"
                  role="listitem"
                >
                  <NarrativeCharacterAvatar
                    name={participant.name}
                    avatarUrl={participant.avatarUrl}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {participant.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isDialogue && speakerId && speakerName && (
          <div className="mb-3 flex items-center gap-2">
            <NarrativeCharacterAvatar
              name={speakerName}
              avatarUrl={speakerRecord?.avatarUrl}
              size="sm"
            />
            <span className="text-sm font-semibold text-blue-700">
              {speakerName}
            </span>
          </div>
        )}

        <FormattedNarrativeContent
          content={formattedContent}
          className={`text-lg narrative-content readable ${resolvedSegment.type === 'scene' ? 'scene-spacing' : ''} ${resolvedSegment.type === 'dialogue' ? 'dialogue-segment' : ''} ${resolvedSegment.type === 'transition' ? 'preserve-breaks' : ''} ${styles.text}`}
          highlightTerms={highlightTerms}
          enableChunking={enableChunking}
          chunkingOptions={{
            minWordsPerChunk: 20,
            maxWordsPerChunk: 150,
            targetWordsPerChunk: 75,
          }}
        />
        {resolvedSegment.metadata?.location && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-500">
              {resolvedSegment.metadata?.location}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
