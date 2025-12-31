import React from 'react';
import { Scale, Flame } from 'lucide-react';
import { ChoiceAlignment, DecisionWeight } from '@/types/narrative.types';

/**
 * Get icon for choice alignment
 */
export const getAlignmentIcon = (alignment?: ChoiceAlignment): React.ReactNode => {
  switch (alignment) {
    case 'lawful':
      return <Scale className="w-4 h-4" aria-hidden="true" />;
    case 'chaotic':
      return <Flame className="w-4 h-4" aria-hidden="true" />;
    case 'neutral':
    default:
      return null;
  }
};

/**
 * Get CSS classes for alignment-based styling
 */
export const getAlignmentClasses = (alignment?: ChoiceAlignment, isDisabled?: boolean): string => {
  const baseClasses = {
    lawful: 'bg-blue-50 border-blue-300',
    chaotic: 'bg-red-200 border-red-300',
    neutral: 'bg-white border-gray-200'
  };

  const hoverClasses = {
    lawful: 'hover:bg-blue-100',
    chaotic: 'hover:bg-red-100',
    neutral: 'hover:bg-gray-100'
  };

  const alignmentKey = alignment || 'neutral';
  const base = baseClasses[alignmentKey];
  const hover = isDisabled ? '' : hoverClasses[alignmentKey];

  return `${base} ${hover}`;
};

/**
 * Get styling for decision weight using border thickness and strategic colors
 * Critical decisions use bright red, while choice alignments use muted red
 */
export const getDecisionWeightStyling = (weight?: DecisionWeight) => {
  switch (weight) {
    case 'critical':
      return {
        container: 'border-4 border-red-500 bg-red-200/50 shadow-lg shadow-red-200',
        dot: 'bg-red-500',
        label: 'text-red-700'
      };
    case 'major':
      return {
        container: 'border-2 border-amber-500 bg-amber-50/60 shadow-md shadow-amber-200',
        dot: 'bg-amber-500',
        label: 'text-amber-700'
      };
    case 'minor':
    default:
      return {
        container: 'border-0 bg-gray-100/5',
        dot: 'bg-gray-700',
        label: 'text-gray-900'
      };
  }
};
