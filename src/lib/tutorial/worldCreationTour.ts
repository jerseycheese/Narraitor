import { Step } from 'react-joyride';

import { WorldCreationStartTooltip } from '@/components/TutorialProvider/WorldCreationStartTooltip';

export const worldCreationTour: Step[] = [
  {
    target: '[data-tutorial="world-type-selector"]',
    content: 'Welcome to the World Creation Wizard! Choose a path: start from scratch on the left, or use a template on the right.',
    placement: 'top',
    disableBeacon: true,
    tooltipComponent: WorldCreationStartTooltip,
  },
  {
    target: '[data-tutorial="create-own-world-btn"]',
    content: 'Start from scratch with Create My Own World and define everything yourself.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
  },
  {
    target: '[data-tutorial="generate-tab"]',
    content: 'Switch to Generate to create a new template you can customize.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
  },
  {
    target: '[data-tutorial="template-list"]',
    content: 'Browse the pre-built templates here to jump-start your world with a curated setup.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
    data: { isEndOfPage: true },
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
  1: 0,
  2: 0,
  3: 0,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
};
