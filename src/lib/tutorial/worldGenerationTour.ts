import { Step } from 'react-joyride';

export const worldGenerationTour: Step[] = [
  {
    target: '[aria-describedby="generate-world-desc"]',
    content: 'This generates a complete world setup for you — a fast way to get started.',
    placement: 'center',
  },
  {
    target: '#world-name',
    content: 'Here you can name your world, or leave it blank to let the system invent one for you.',
    placement: 'auto',
  },
  {
    target: '[role="radiogroup"]', // Targets the WorldTypeSelector
    content: 'You can choose "Original" for a unique setting, or use "Inspired By" / "Set Within" to draw on existing fiction or history.',
    placement: 'auto',
  },
  {
    target: '[data-tutorial="generate-world-button"]',
    content: "When you're ready, this creates your world — attributes, skills, and a cover image, generated automatically.",
    placement: 'auto',
  },
];
