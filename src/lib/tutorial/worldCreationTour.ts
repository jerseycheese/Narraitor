import { Step } from 'react-joyride';

export const worldCreationTour: Step[] = [
  {
    target: '[data-tutorial="world-type-selector"]',
    content: 'Start here! Choose a template for a quick start, "Create My Own World" for total control, or switch to the "Generate" tab to let the system build a foundation for you.',
    placement: 'bottom',
    disableBeacon: false,
  },
  {
    target: '[data-tutorial="genre-picker"]',
    content: 'Select a genre to define the tone and available options for your world. This influences the storytelling style.',
    placement: 'auto',
  },
  {
    target: '[data-tutorial="world-description"]',
    content: 'Describe your world in detail. This will be used to generate rich lore, locations, and history.',
    placement: 'auto',
  },
  {
    target: '[data-tutorial="attribute-editor"]',
    content: 'Review and customize the core attributes that define characters in your world.',
    placement: 'auto',
  },
  {
    target: '[data-tutorial="skill-editor"]',
    content: 'Define the skills characters can learn. These are based on the genre and attributes you selected.',
    placement: 'auto',
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
