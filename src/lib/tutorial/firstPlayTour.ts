import { Step } from 'react-joyride';

/**
 * First Play Tour Steps
 * Guides the user through their first game session.
 */
export const firstPlayTour: Step[] = [
  {
    target: '[data-testid="game-session-active"]',
    content: 'Your adventure begins! This is where you\'ll spend most of your time roleplaying and making decisions.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.narrative-history-container',
    content: 'The story unfolds here. Read the narrative to understand your surroundings and the current situation.',
    placement: 'right',
  },
  {
    target: '#choices-container',
    content: 'When the AI presents you with options, they\'ll appear here. You can pick one of the suggestions or type your own custom action!',
    placement: 'left',
  },
  {
    target: '[data-testid="character-summary"]',
    content: 'Keep an eye on your character\'s stats and health here. You can expand this section to see your full attribute and skill list.',
    placement: 'top',
  },
  {
    target: '[data-testid="inventory-collapsible"]',
    content: 'Any items you find or acquire during your journey will show up in your inventory.',
    placement: 'top',
  },
  {
    target: '.component-floating-action-button',
    content: 'The journal automatically tracks your major decisions and discoveries. Open it anytime to review your story\'s history.',
    placement: 'left',
  },
];