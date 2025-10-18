import React from 'react';
import Image from 'next/image';
import { NarrativeSegment } from '@/types/narrative.types';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatAIResponse, FormattingOptions } from '@/lib/utils/textFormatter';
import { parseNarrativeContent } from '@/lib/utils';
import { FormattedNarrativeContent } from './FormattedNarrativeContent';
import { useNPCStore } from '@/state/npcStore';


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
  const { getById } = useNPCStore();

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

  if (!segment) {
    return null;
  }

  const getSegmentStyles = (type: string) => {
    switch (type) {
      case 'dialogue':
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50',
          text: 'italic text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'action':
        return {
          container: 'border-2 border-amber-300 bg-amber-50',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-amber-500 font-semibold mb-2'
        };
      case 'decision':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'font-medium text-gray-900',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'combat':
        return {
          container: 'border-2 border-red-300 bg-red-200',
          text: 'font-bold text-gray-900',
          label: 'text-xs uppercase text-red-500 font-semibold mb-2'
        };
      case 'exploration':
        return {
          container: 'border-2 border-green-300 bg-green-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-green-500 font-semibold mb-2'
        };
      case 'resolution':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'character_interaction':
        return {
          container: 'border-2 border-blue-300 bg-blue-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-blue-700 font-semibold mb-2'
        };
      case 'revelation':
        return {
          container: 'border-2 border-red-300 bg-red-50',
          text: 'font-medium italic text-gray-900',
          label: 'text-xs uppercase text-red-500 font-semibold mb-2'
        };
      case 'transition':
        return {
          container: 'bg-gray-100 border border-gray-300',
          text: 'text-gray-700 text-sm italic',
          label: 'text-xs uppercase text-gray-500 font-semibold mb-2'
        };
      case 'scene':
      default:
        return {
          container: 'bg-white border border-gray-200',
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

  const styles = getSegmentStyles(segment.type);
  const formattingOptions = getFormattingOptions(segment.type);
  const parsedContent = parseNarrativeContent(segment.content);
  const formattedContent = formatAIResponse(parsedContent, formattingOptions);

  // Get speaker information for dialogue segments
  const speaker = segment.type === 'dialogue' && segment.metadata?.speakerId
    ? getById(segment.metadata.speakerId)
    : null;

  return (
    <div className="space-y-3 snap-center">
      <div className={`narrative-segment p-6 rounded-lg ${styles.container}`}>
        <p className={styles.label}>{segment.type}</p>

        {speaker && (
          <div className="flex items-center gap-2 mb-3">
            {speaker.avatarUrl && (
              <Image
                src={speaker.avatarUrl}
                alt={speaker.name}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            )}
            <span className="text-sm font-semibold text-blue-700">
              {speaker.name}
            </span>
          </div>
        )}

        <FormattedNarrativeContent
          content={formattedContent}
          className={`text-lg narrative-content readable ${segment.type === 'scene' ? 'scene-spacing' : ''} ${segment.type === 'dialogue' ? 'dialogue-segment' : ''} ${segment.type === 'transition' ? 'preserve-breaks' : ''} ${styles.text}`}
        />
        {segment.metadata?.location && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {segment?.metadata?.location}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
