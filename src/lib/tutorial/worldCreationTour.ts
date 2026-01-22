import { Step } from 'react-joyride';

/**
 * World Creation Tour Steps
 * Guides the user through the process of creating a new world.
 */
export const worldCreationTour: Step[] = [
  {
    target: '[data-testid="template-step"]',
    content: 'Welcome! You can start by choosing a template, generating one with AI, or creating your own world from scratch.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-testid="create-own-button"]',
    content: 'For this tutorial, let\'s create a world from scratch. Click here to begin!',
    placement: 'top',
  },
  {
    target: '[data-testid="basic-info-step"]',
    content: 'Give your world a name and choose a genre. The genre helps the AI understand the themes and rules of your world.',
    placement: 'top',
  },
  {
    target: '[data-testid="relationship-based-on-radio"]',
    content: 'You can also base your world on an existing setting or make it completely original.',
    placement: 'top',
  },
  {
    target: '[data-testid="description-step"]',
    content: 'Describe your world in detail. The more info you provide, the better the AI can help you with suggestions.',
    placement: 'top',
  },
  {
    target: '[data-testid="generate-ai-suggestions"]',
    content: 'Once you have 50+ characters, click here to get AI-generated attributes and skills tailored to your world.',
    placement: 'top',
  },
  {
    target: '[data-testid="attribute-review-step"]',
    content: 'Review the attributes. You can select the ones you like, customize them, or add your own unique ones.',
    placement: 'top',
  },
  {
    target: '[data-testid="skill-review-step"]',
    content: 'Same for skills! Skills define what characters can do. Make sure they fit your world\'s theme.',
    placement: 'top',
  },
  {
    target: '[data-testid="finalize-step"]',
    content: 'Almost done! Review everything one last time and generate a beautiful image for your world.',
    placement: 'top',
  },
  {
    target: '[data-testid="step-complete-button"]',
    content: 'Ready? Click here to bring your world to life!',
    placement: 'top',
  },
  {
    target: '[data-testid="archetypes-grid"]',
    content: 'Success! Your world is created. Now choose a character archetype to start playing immediately, or customize your own.',
    placement: 'top',
  },
];

/**
 * Mapping of tour step indices to wizard step indices.
 * Used by TutorialProvider to sync the tour progress with the wizard.
 */
export const tourStepToWizardStep: Record<number, number> = {
  0: 0, // Welcome -> Template
  1: 0, // Create Own -> Template
  2: 1, // Basic Info -> Basic Info
  3: 1, // World Type -> Basic Info
  4: 2, // Description -> Description
  5: 2, // Generate AI -> Description
  6: 3, // Attributes -> Attributes
  7: 4, // Skills -> Skills
  8: 5, // Finalize -> Finalize
  9: 5, // Create -> Finalize
  10: 6, // Quick Start -> Quick Start
};