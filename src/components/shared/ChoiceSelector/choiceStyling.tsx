import { ChoiceAlignment, DecisionWeight } from '@/types/narrative.types';

/**
 * Get CSS classes for alignment-based styling
 */
export const getAlignmentClasses = (
  alignment?: ChoiceAlignment,
  isDisabled?: boolean
): string => {
  if (isDisabled) return '';
  switch (alignment) {
    case 'lawful':
      return 'manuscript-suggested-action-lawful';
    case 'chaotic':
      return 'manuscript-suggested-action-chaotic';
    default:
      return '';
  }
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
