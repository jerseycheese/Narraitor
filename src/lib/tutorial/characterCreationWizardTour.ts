import { Step } from 'react-joyride';
import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const characterCreationWizardTour: Step[] = [
  {
    target: '[data-tutorial="template-selector"]',
    content: TutorialContent({
      children: 'You can choose a character template to get a head start, or build your hero from scratch.',
      example: 'Warrior for a combat-focused character with high Strength',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="basic-info"]',
    content: TutorialContent({
      children: "Here's where you'll name your character and add a description.",
      example: '"Kira Nightshade" with a backstory hint like "a cunning rogue with a mysterious past"',
    }),
    placement: 'bottom',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="attribute-allocation"]',
    content: TutorialContent({
      children: "This is where you'll distribute points across your core attributes, which determine your character's natural strengths and weaknesses.",
      example: 'High Strength for a fighter who relies on physical power',
    }),
    placement: 'bottom',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="skill-selection"]',
    content: TutorialContent({
      children: "Here you can select skills that define what your character excels at.",
      example: 'Stealth for a character who prefers avoiding direct confrontation',
    }),
    placement: 'bottom',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="background-editor"]',
    content: TutorialContent({
      children: "This section is for fleshing out your backstory. Where are you from? What motivates you?",
      example: '"Orphaned during the war" to explain their distrust of authority',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="portrait-generator"]',
    content: 'You can generate a unique portrait based on your character description, or upload your own image.',
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
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
