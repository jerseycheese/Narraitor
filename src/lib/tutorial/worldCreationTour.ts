import { Step } from 'react-joyride';

import { WorldCreationStartTooltip } from '@/components/TutorialProvider/WorldCreationStartTooltip';

export const worldCreationTour: Step[] = [
  {
    target: '[data-tutorial="world-type-selector"]',
    content: 'Start here! Choose a template for a quick start, "Create My Own World" for total control, or switch to the "Generate" tab to let the system build a foundation for you.',
    placement: 'top',
    disableBeacon: true,
    tooltipComponent: WorldCreationStartTooltip,
  },
  {
    target: '[data-tutorial="genre-picker"]',
    content: 'Select a genre to define the tone and available options for your world. This influences the storytelling style.',
    placement: 'top',
  },
  {
    target: '[data-tutorial="world-description"]',
    content: 'Describe your world in detail. This will be used to generate rich lore, locations, and history.',
    placement: 'top',
  },
  {
    target: '[data-tutorial="attribute-editor"]',
    content: 'Review and customize the core attributes that define characters in your world.',
    placement: 'top',
  },
  {
    target: '[data-tutorial="skill-editor"]',
    content: 'Define the skills characters can learn. These are based on the genre and attributes you selected.',
    placement: 'top',
  },
  {
    target: '[data-tutorial="finalize-world"]',
    content: 'Review your world details and create it! You\'re just one step away from your adventure.',
    placement: 'top',
  },
];

export const tourStepToWizardStep: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};
