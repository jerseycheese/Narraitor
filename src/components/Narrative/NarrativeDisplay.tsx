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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating narrative...</p>
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