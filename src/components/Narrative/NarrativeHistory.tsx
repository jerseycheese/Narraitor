import React from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';

interface NarrativeHistoryProps {
  segments: NarrativeSegment[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export const NarrativeHistory: React.FC<NarrativeHistoryProps> = ({
  segments,
  isLoading = false,
  error,
  className = ''
}) => {
  return (
    <div className={`narrative-history space-y-4 ${className}`}>
      {/* Show all previous segments */}
      {segments.map((segment) => (
        <NarrativeDisplay 
          key={segment.id}
          segment={segment}
          isLoading={false}
          error={undefined}
        />
      ))}
      
      {/* Show loading state for new segment */}
      {isLoading && (
        <NarrativeDisplay 
          segment={null}
          isLoading={true}
          error={undefined}
        />
      )}
      
      {/* Show error if any */}
      {error && !isLoading && (
        <NarrativeDisplay 
          segment={null}
          isLoading={false}
          error={error}
        />
      )}
    </div>
  );
};