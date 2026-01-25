import { Step } from 'react-joyride';

export const worldGenerationTour: Step[] = [
  {
    target: '[aria-describedby="generate-world-desc"]',
    content: 'This tool lets you instantly generate a complete world setup. Perfect for quick starts!',
    placement: 'center',
  },
  {
    target: 'input[placeholder="e.g., The Lost Kingdom"]',
    content: 'Give your world a name, or leave it blank to let the system invent one for you.',
    placement: 'auto',
  },
  {
    target: '[role="radiogroup"]', // Targets the WorldTypeSelector
    content: 'Choose "Original" for a unique setting, or use "Inspired By" / "Set Within" to leverage existing fiction or history.',
    placement: 'auto',
  },
  {
    target: 'button[type="submit"]', // Targets the primary action button
    content: 'Click here to create your world! The system will generate attributes, skills, and a cover image automatically.',
    placement: 'auto',
  },
];
