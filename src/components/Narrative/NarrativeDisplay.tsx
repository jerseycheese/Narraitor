import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';

interface NarrativeDisplayProps {
  segment: NarrativeSegment | null;
  isLoading?: boolean;
  error?: string;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  segment,
  isLoading = false,
  error
}) => {
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-muted-foreground">Generating narrative...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!segment) {
    return null;
  }

  const getSegmentStyles = (type: string) => {
    switch (type) {
      case 'dialogue':
        return 'italic text-left pl-8 pr-4';
      case 'action':
        return 'font-medium text-center';
      case 'transition':
        return 'text-muted-foreground text-sm';
      default:
        return '';
    }
  };

  return (
    <div className={`narrative-segment p-6 rounded-lg bg-card ${getSegmentStyles(segment.type)}`}>
      <p className="text-lg leading-relaxed whitespace-pre-wrap">
        {segment.content}
      </p>
      {segment.metadata?.location && (
        <p className="text-sm text-muted-foreground mt-4">
          Location: {segment.metadata.location}
        </p>
      )}
    </div>
  );
};