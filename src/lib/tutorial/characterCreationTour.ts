import { Step } from 'react-joyride';

/**
 * Character Creation Tour Steps
 * Guides the user through the process of creating a new character.
 */
export const characterCreationTour: Step[] = [
  {
    target: '[data-testid="template-card"]',
    content: 'Start by choosing a character template that fits your playstyle, or skip ahead to create your hero from scratch.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-testid="character-name-input"]',
    content: 'Give your character a name and a brief description. This helps define their presence in the world.',
    placement: 'top',
  },
  {
    target: '[data-testid="attributes-step"]',
    content: 'Allocate points to your core attributes. These define your character\'s innate strengths and weaknesses.',
    placement: 'top',
  },
  {
    target: '[data-testid="skills-step"]',
    content: 'Choose your skills! Skills are specialized abilities that you\'ll use to overcome challenges during your adventure.',
    placement: 'top',
  },
  {
    target: '[data-testid="background-step"]',
    content: 'Flesh out your character\'s history, personality, and motivations. This adds depth to your roleplaying experience.',
    placement: 'top',
  },
  {
    target: '[data-testid="portrait-step"]',
    content: 'Finally, generate a unique AI portrait for your character based on their description and background.',
    placement: 'top',
  },
  {
    target: '[data-testid="step-complete-button"]',
    content: 'All set! Click here to create your character and start your journey.',
    placement: 'top',
  },
];

/**
 * Mapping of tour step indices to wizard step indices.
 * Used by TutorialProvider to sync the tour progress with the wizard.
 */
export const tourStepToWizardStep: Record<number, number> = {
  0: 0, // Template
  1: 1, // Basic Info
  2: 2, // Attributes
  3: 3, // Skills
  4: 4, // Background
  5: 5, // Portrait
  6: 5, // Create
};