import { Step } from 'react-joyride';

import { WorldCreationStartTooltip } from '@/components/TutorialProvider/WorldCreationStartTooltip';
import { TutorialContent } from '@/components/TutorialProvider/TutorialContent';

export const worldCreationTour: Step[] = [
  {
    target: '[data-tutorial="world-name"]',
    content: TutorialContent({
      children: "Here's where you'll name your world to make it feel distinct.",
      example: '"The Shattered Realms" to evoke a fractured fantasy kingdom',
    }),
    placement: 'right',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="genre-picker"]',
    content: TutorialContent({
      children: "Here you'll select a genre to define the tone and available options.",
      example: 'Cyberpunk for neon-lit dystopias with hackers and megacorps',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="world-type"]',
    content: TutorialContent({
      children: 'This is where you choose whether your world is original, inspired by, or set within an existing setting.',
      example: 'Inspired By to create your own spin on a favorite universe',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="world-reference"]',
    content: TutorialContent({
      children: "Here you'll enter the setting your world should follow.",
      example: '"Star Wars during the Old Republic era" for that specific time period',
    }),
    placement: 'top',
    disableBeacon: true,
    data: { skipIfMissing: true },
  },
  {
    target: '[data-tutorial="tone-content-rating"]',
    content: TutorialContent({
      children: "This is where you'll set the content rating to match your audience.",
      example: 'PG-13 for moderate themes and action without explicit content',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    data: { autoScroll: true },
  },
  {
    target: '[data-tutorial="tone-narrative-style"]',
    content: TutorialContent({
      children: "Here you can pick the narrative style that fits your world.",
      example: 'Epic for grand-scale stories with heroic themes',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="tone-language-complexity"]',
    content: TutorialContent({
      children: 'This setting adjusts language complexity to match your reading preference.',
      example: 'Literary for sophisticated prose with artistic expression',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="tone-custom-instructions"]',
    content: TutorialContent({
      children: 'You can add extra guidance for how stories should be told.',
      example: '"Emphasize moral dilemmas" to make choices feel meaningful',
    }),
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
    disableBeacon: true,
    disableScrolling: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="world-description"]',
    content: TutorialContent({
      children: "Here's where you'll describe your world in detail. This will be used to generate rich lore, locations, and history.",
      example: '"A war-torn kingdom where magic is fading" sets up conflict and stakes',
    }),
    placement: 'top',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="ai-suggestions-actions"]',
    content: TutorialContent({
      children: 'You can click Generate to get suggested attributes and skills based on your description.',
      example: 'A cyberpunk world might suggest "Hacking" and "Street Cred"',
    }),
    placement: 'top',
    offset: 12,
    spotlightPadding: 8,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="ai-suggestions-preview"]',
    content: 'Preview the suggestions before reviewing them in detail. You can accept, modify, or reject each one on the next steps.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
    disableBeacon: true,
    disableScrolling: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="attribute-editor"]',
    content: TutorialContent({
      children: "Here's where you'll review and customize the core attributes that define characters.",
      example: '"Willpower" to represent mental fortitude in a horror setting',
    }),
    placement: 'top',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="attribute-suggestions"]',
    content: TutorialContent({
      children: 'You can use the suggested attributes or customize them.',
      example: 'Rename "Strength" to "Might" for a more fantasy feel',
    }),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="attribute-custom"]',
    content: TutorialContent({
      children: 'This section lets you add custom attributes unique to your setting.',
      example: '"Corruption" to track dark magic influence in your world',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    data: { autoScroll: 'down' },
  },
  {
    target: '[data-tutorial="attribute-summary"]',
    content: 'Keep an eye on how many attribute slots you have left. Most worlds work well with 4-6 core attributes.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
    disableBeacon: true,
    disableScrolling: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="skill-editor"]',
    content: TutorialContent({
      children: "Here's where you'll define the skills characters can learn.",
      example: '"Persuasion" for social encounters and negotiations',
    }),
    placement: 'top',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="skill-suggestions"]',
    content: TutorialContent({
      children: 'You can review the suggested skills and tweak them.',
      example: 'Rename "Melee Combat" to "Blade Dancing" for a unique feel',
    }),
    placement: 'bottom',
    offset: 12,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="skill-custom"]',
    content: TutorialContent({
      children: 'This section lets you create custom skills for your world.',
      example: '"Dragon Riding" to enable aerial adventures in your fantasy world',
    }),
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    data: { autoScroll: 'down' },
  },
  {
    target: '[data-tutorial="skill-summary"]',
    content: 'Track how many skills you have selected. Aim for 8-12 skills to give characters meaningful choices without overwhelming options.',
    placement: 'top',
    tooltipComponent: WorldCreationStartTooltip,
    disableBeacon: true,
    disableScrolling: true,
    data: { isEndOfPage: true },
  },
  {
    target: '[data-tutorial="finalize-review"]',
    content: 'Review the core world details before you finalize.',
    placement: 'top',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '[data-tutorial="finalize-image"]',
    content: 'You can generate a world image to visualize your setting based on your description and genre.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="finalize-attributes"]',
    content: "Here you can double-check the attributes you've chosen. You can still go back to make changes.",
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '[data-tutorial="finalize-skills"]',
    content: "Here's where you can confirm the skills list before creating the world. You can still go back to make changes.",
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
    data: { autoScroll: 'down' },
  },
  {
    target: '[data-tutorial="finalize-world"]',
    content: "Here's where you'll review your world details and create it! You're just one step away from your adventure.",
    placement: 'top',
    disableBeacon: true,
    disableScrolling: true,
  },
];

export const tourStepToWizardStep: Record<number, number> = {
  // Basic Information (step 0)
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  // World Description (step 1)
  8: 1,
  9: 1,
  10: 1,
  // Review Attributes (step 2)
  11: 2,
  12: 2,
  13: 2,
  14: 2,
  // Review Skills (step 3)
  15: 3,
  16: 3,
  17: 3,
  18: 3,
  // Finalize (step 4)
  19: 4,
  20: 4,
  21: 4,
  22: 4,
  23: 4,
};
