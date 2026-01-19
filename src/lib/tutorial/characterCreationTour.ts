import { Step } from 'react-joyride';

export const characterCreationTour: Step[] = [
  {
    target: '[data-tutorial="template-selector"]',
    content:
      'Choose a character template to get a head start, or build your hero from scratch. Example: Pick "Warrior" for a combat-focused character or "Mystic" for magic users.',
    placement: 'bottom',
    disableBeacon: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="basic-info"]',
    content:
      'Give your character a name and description. Example: "Kira Nightshade, a cunning rogue with a mysterious past and a talent for getting into trouble".',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="attribute-allocation"]',
    content:
      'Allocate points to your core attributes. Example: A warrior might prioritize Strength and Constitution, while a mage focuses on Intelligence and Willpower.',
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="skill-selection"]',
    content:
      'Select skills that define what your character excels at. Example: A thief might choose Lockpicking, Stealth, and Perception.',
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="background-editor"]',
    content:
      'Flesh out your backstory. Example: "Raised on the streets of the capital, they learned to survive by their wits before being recruited by a secret guild".',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="portrait-generator"]',
    content:
      'Generate a unique portrait using AI based on your character description, or upload your own image.',
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
