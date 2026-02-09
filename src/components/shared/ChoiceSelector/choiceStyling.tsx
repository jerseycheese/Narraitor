import React from 'react';
import { Scale, Flame } from 'lucide-react';
import { ChoiceAlignment, DecisionWeight } from '@/types/narrative.types';

/**
 * Get icon for choice alignment
 */
export const getAlignmentIcon = (alignment?: ChoiceAlignment): React.ReactNode => {
  switch (alignment) {
    case 'lawful':
      return <Scale  aria-hidden="true" />;
    case 'chaotic':
      return <Flame  aria-hidden="true" />;
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
    lawful: '',
    chaotic: '',
    neutral: ''
  };

  const hoverClasses = {
    lawful: '',
    chaotic: '',
    neutral: ''
  };

  const alignmentKey = alignment || 'neutral';
  const base = baseClasses[alignmentKey];
  const hover = isDisabled ? '' : hoverClasses[alignmentKey];

  return `${base}${hover}`;
};

/**
 * Get styling for decision weight using border thickness and strategic colors
 * Critical decisions use bright red, while choice alignments use muted red
 */
export const getDecisionWeightStyling = (weight?: DecisionWeight) => {
  switch (weight) {
    case 'critical':
      return {
        container: '',
        dot: '',
        label: ''
      };
    case 'major':
      return {
        container: '',
        dot: '',
        label: ''
      };
    case 'minor':
    default:
      return {
        container: '',
        dot: '',
        label: ''
      };
  }
};
