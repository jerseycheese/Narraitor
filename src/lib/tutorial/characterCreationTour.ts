import { Step } from 'react-joyride';

export const characterCreationTour: Step[] = [
  {
    target: '[data-tutorial="template-selector"]',
    content: 'Choose a character template to get a head start, or build your hero from scratch.',
    placement: 'bottom',
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="basic-info"]',
    content: 'Give your character a name and a short description. This helps the AI understand who they are.',
    placement: 'right',
  },
  {
    target: '[data-tutorial="attribute-allocation"]',
    content: 'Allocate points to your core attributes. These determine your natural strengths and weaknesses.',
    placement: 'left',
  },
  {
    target: '[data-tutorial="skill-selection"]',
    content: 'Select skills that define what your character is good at. Pick ones that match your attributes!',
    placement: 'left',
  },
  {
    target: '[data-tutorial="background-editor"]',
    content: 'Flesh out your backstory. Where are you from? What motivates you? This adds depth to your story.',
    placement: 'bottom',
  },
  {
    target: '[data-tutorial="portrait-generator"]',
    content: 'Generate a unique portrait for your character using AI, or upload your own image.',
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
