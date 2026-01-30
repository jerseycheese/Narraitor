import { Step } from 'react-joyride';
import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const quickStartTour: Step[] = [
  {
    target: '[data-tutorial="quickstart-archetypes"]',
    content: 'These are pre-generated characters you can select to start playing immediately. Each character is unique to this world.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="quickstart-random"]',
    content: 'This button generates a random character instantly - great for jumping into the action without customization.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="quickstart-custom"]',
    content: 'Want more control? This wizard walks you through custom character creation step-by-step.',
    placement: 'top',
    disableBeacon: true,
  },
];
