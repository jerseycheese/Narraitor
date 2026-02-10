import React from 'react';
import { Scale, Flame } from 'lucide-react';
import { ChoiceAlignment, DecisionWeight } from '@/types/narrative.types';

/**
 * Get icon for choice alignment
 */
export const getAlignmentIcon = (
  alignment?: ChoiceAlignment
): React.ReactNode => {
  switch (alignment) {
    case 'lawful':
      return <Scale aria-hidden="true" />;
    case 'chaotic':
      return <Flame aria-hidden="true" />;
    case 'neutral':
    default:
      return null;
  }
};

/**
 * Get CSS classes for alignment-based styling
 */
export const getAlignmentClasses = (
  alignment?: ChoiceAlignment,
  isDisabled?: boolean
): string => {
  return '';
};

/**
 * Get styling for decision weight using border thickness and strategic colors
 * Critical decisions use bright red, while choice alignments use muted red
 */
export const getDecisionWeightStyling = (weight?: DecisionWeight) => {
  return {
    container: '',
    dot: '',
    label: '',
  };
};
