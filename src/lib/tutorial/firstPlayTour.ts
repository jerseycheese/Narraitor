import { Step } from 'react-joyride';

export const firstPlayTour: Step[] = [
  {
    target: '[data-tutorial="narrative-display"]',
    content: 'This is where your story unfolds. Read the narrative carefully as it adapts to your choices.',
    placement: 'right',
  },
  {
    target: '[data-tutorial="player-choices"]',
    content: 'When the story pauses, you decide what happens next. Your choices shape the world and your character\'s fate.',
    placement: 'top',
  },
  {
    target: '[data-tutorial="character-sheet-toggle"]',
    content: 'Check your character sheet anytime to see your stats, health, and current status.',
    placement: 'bottom',
  },
  {
    target: '[data-tutorial="inventory-toggle"]',
    content: 'Manage your inventory here. You can equip items or use consumables during your adventure.',
    placement: 'bottom',
  },
  {
    target: '[data-tutorial="journal-toggle"]',
    content: 'Your journal keeps track of your quests, important notes, and the history of your adventure.',
    placement: 'bottom',
  },
];
