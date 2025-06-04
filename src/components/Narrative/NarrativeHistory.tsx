import React, { useEffect, useRef } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';

interface NarrativeHistoryProps {
  segments: NarrativeSegment[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  onRetry?: () => void;
}

export const NarrativeHistory: React.FC<NarrativeHistoryProps> = ({
  segments,
  isLoading = false,
  error,
  className = '',
  onRetry
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevSegmentCountRef = useRef(segments.length);
  const userHasScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);

  // Detect manual scrolling
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "near bottom" if within 100px
    isNearBottomRef.current = distanceFromBottom < 100;
    
    // If user scrolled up significantly, mark as manual scroll
    if (distanceFromBottom > 100) {
      userHasScrolledRef.current = true;
    }
  };

  // Auto-scroll to bottom when new segments are added (only if near bottom)
  useEffect(() => {
    if (segments.length > prevSegmentCountRef.current && scrollContainerRef.current) {
      // Only auto-scroll if user hasn't manually scrolled or is near bottom
      if (!userHasScrolledRef.current || isNearBottomRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
        userHasScrolledRef.current = false; // Reset manual scroll flag
      }
    }
    prevSegmentCountRef.current = segments.length;
  }, [segments.length]);
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
          onRetry={onRetry}
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

  // Only apply fixed height after 2 segments
  const heightClass = segments.length >= 2 ? 'h-[600px]' : '';
  
  return (
    <div 
      ref={scrollContainerRef}
      className={`narrative-history ${heightClass} overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner ${className}`}
      onScroll={handleScroll}
    >
      <div className="space-y-6 p-4">
        {renderContent()}
      </div>
    </div>
  );
};
