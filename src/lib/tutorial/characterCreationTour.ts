import { Step } from 'react-joyride';
import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const characterCreationTour: Step[] = [
  {
    target: '[data-tutorial="quickstart-archetypes"]',
    content: 'Pick a pre-made character to jump straight into the story.',
    placement: 'top',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="quickstart-random"]',
    content: 'Generate a fresh random character if you want a new option.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="quickstart-custom"]',
    content: 'Create a custom character with full control over details.',
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    advanceOn: { selector: '[data-tutorial="quickstart-custom"]', event: 'click' },
  },
  {
    target: '[data-tutorial="template-selector"]',
    content: TutorialContent({
      children: 'Choose a character template to get a head start, or build your hero from scratch.',
      example: 'Warrior for a combat-focused character with high Strength',
    }),
    placement: 'top',
    disableBeacon: true,
    data: {
      isEndOfPage: true,
      nextStepHint: 'Select a template (or leave it blank) and click Next to continue.',
    },
  },
  {
    target: '[data-tutorial="basic-info"]',
    content: TutorialContent({
      children: 'Give your character a name and description.',
      example: '"Kira Nightshade" with a backstory hint like "a cunning rogue with a mysterious past"',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="attribute-allocation"]',
    content: TutorialContent({
      children: 'Allocate points to your core attributes. These determine your natural strengths and weaknesses.',
      example: 'High Strength for a fighter who relies on physical power',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="skill-selection"]',
    content: TutorialContent({
      children: 'Select skills that define what your character excels at.',
      example: 'Stealth for a character who prefers avoiding direct confrontation',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="background-editor"]',
    content: TutorialContent({
      children: 'Flesh out your backstory. Where are you from? What motivates you?',
      example: '"Orphaned during the war" to explain their distrust of authority',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="portrait-generator"]',
    content: 'Generate a unique portrait based on your character description, or upload your own image.',
    placement: 'top',
    disableBeacon: true,
    data: {
      nextStepHint: 'Click Create Character to finish and start playing.',
    },
  },
];

export const tourStepToWizardStep: Record<number, number> = {
  3: 0,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
};
