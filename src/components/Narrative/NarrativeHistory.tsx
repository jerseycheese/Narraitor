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
  // Only render once to prevent flashing
  const renderContent = () => {
    // If we're loading with no segments, just show the loading indicator
    if (isLoading && segments.length === 0) {
      return (
        <NarrativeDisplay 
          segment={null}
          isLoading={true}
          error={undefined}
        />
      );
    }
    
    // If we have an error and we're not loading, show the error
    if (error && !isLoading) {
      return (
        <NarrativeDisplay 
          segment={null}
          isLoading={false}
          error={error}
        />
      );
    }
    
    // If we have segments, render them
    if (segments.length > 0) {
      return (
        <>
          {segments.map((segment) => (
            <NarrativeDisplay 
              key={segment.id}
              segment={segment}
              isLoading={false}
              error={undefined}
            />
          ))}
          
          {/* Loading indicator for additional segments */}
          {isLoading && (
            <NarrativeDisplay 
              segment={null}
              isLoading={true}
              error={undefined}
            />
          )}
        </>
      );
    }
    
    // Default to loading
    return (
      <NarrativeDisplay 
        segment={null}
        isLoading={true}
        error={undefined}
      />
    );
  };

  return (
    <div 
      className={`narrative-history space-y-4 ${className}`}
      style={{
        opacity: 1, // Always 1 to prevent flashing
        minHeight: '200px', // Ensures space is reserved
      }}
    >
      {renderContent()}
    </div>
  );
};