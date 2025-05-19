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
      <div className="p-6 border border-red-300 rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Generating Narrative</h3>
        <p className="text-red-600">{error}</p>
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
          container: 'border-l-4 border-blue-400 bg-blue-50',
          text: 'italic text-gray-700',
          label: 'text-xs uppercase text-blue-600 font-semibold mb-2'
        };
      case 'action':
        return {
          container: 'border-2 border-orange-300 bg-orange-50',
          text: 'font-medium text-gray-800',
          label: 'text-xs uppercase text-orange-600 font-semibold mb-2'
        };
      case 'decision':
        return {
          container: 'border-2 border-purple-300 bg-purple-50',
          text: 'font-medium text-gray-800',
          label: 'text-xs uppercase text-purple-600 font-semibold mb-2'
        };
      case 'combat':
        return {
          container: 'border-2 border-red-300 bg-red-50',
          text: 'font-bold text-gray-800',
          label: 'text-xs uppercase text-red-600 font-semibold mb-2'
        };
      case 'exploration':
        return {
          container: 'border-2 border-green-300 bg-green-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-green-600 font-semibold mb-2'
        };
      case 'resolution':
        return {
          container: 'border-2 border-indigo-300 bg-indigo-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-indigo-600 font-semibold mb-2'
        };
      case 'character_interaction':
        return {
          container: 'border-2 border-cyan-300 bg-cyan-50',
          text: 'text-gray-700',
          label: 'text-xs uppercase text-cyan-600 font-semibold mb-2'
        };
      case 'revelation':
        return {
          container: 'border-2 border-pink-300 bg-pink-50',
          text: 'font-medium italic text-gray-800',
          label: 'text-xs uppercase text-pink-600 font-semibold mb-2'
        };
      case 'transition':
        return {
          container: 'bg-gray-100 border border-gray-300',
          text: 'text-gray-600 text-sm italic',
          label: 'text-xs uppercase text-gray-500 font-semibold mb-2'
        };
      case 'scene':
      default:
        return {
          container: 'bg-white border border-gray-200',
          text: 'text-gray-800',
          label: 'text-xs uppercase text-gray-600 font-semibold mb-2'
        };
    }
  };

  const styles = getSegmentStyles(segment.type);

  return (
    <div className={`narrative-segment p-6 rounded-lg ${styles.container}`}>
      <p className={styles.label}>{segment.type}</p>
      <p className={`text-lg leading-relaxed whitespace-pre-wrap ${styles.text}`}>
        {segment.content}
      </p>
      {segment.metadata?.location && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {segment.metadata.location}
          </p>
        </div>
      )}
    </div>
  );
};