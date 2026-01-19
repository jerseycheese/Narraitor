import { Step } from 'react-joyride';

import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const characterCreationTour: Step[] = [
  {
    target: '[data-tutorial="template-selector"]',
    content: TutorialContent({
      children: 'Choose a character template to get a head start, or build your hero from scratch.',
      example: 'Pick "Warrior" for a combat-focused character or "Mystic" for magic users',
    }),
    placement: 'bottom',
    disableBeacon: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="basic-info"]',
    content: TutorialContent({
      children: 'Give your character a name and description.',
      example: '"Kira Nightshade, a cunning rogue with a mysterious past and a talent for getting into trouble"',
    }),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="attribute-allocation"]',
    content: TutorialContent({
      children: 'Allocate points to your core attributes. These determine your natural strengths and weaknesses.',
      example: 'A warrior might prioritize Strength and Constitution, while a mage focuses on Intelligence',
    }),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="skill-selection"]',
    content: TutorialContent({
      children: 'Select skills that define what your character excels at.',
      example: 'A thief might choose Lockpicking, Stealth, and Perception',
    }),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="background-editor"]',
    content: TutorialContent({
      children: 'Flesh out your backstory. Where are you from? What motivates you?',
      example: '"Raised on the streets of the capital, they learned to survive by their wits before joining a secret guild"',
    }),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="portrait-generator"]',
    content: 'Generate a unique portrait using AI based on your character description, or upload your own image.',
    placement: 'top',
    disableBeacon: true,
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
