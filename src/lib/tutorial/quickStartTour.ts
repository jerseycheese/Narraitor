import { Step } from 'react-joyride';
import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const quickStartTour: Step[] = [
  {
    target: '[data-tutorial="quickstart-archetypes"]',
    content: TutorialContent({
      children: 'Choose one of these pre-generated characters to start playing immediately.',
      example: 'Each character is unique to this world',
    }),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="quickstart-random"]',
    content: TutorialContent({
      children: 'Generate a completely new random character with one click.',
      example: 'Great for jumping into the action instantly',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="quickstart-custom"]',
    content: TutorialContent({
      children: 'Want more control? Create a custom character from scratch.',
      example: 'Build your hero step-by-step',
    }),
    placement: 'top',
    disableBeacon: true,
  },
];
