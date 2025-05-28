import { FallbackContent } from '../types';

/**
 * Generic content that can work across multiple themes
 * Used as last resort when theme-specific content isn't available
 */
export const genericContent: FallbackContent[] = [
  {
    id: 'generic-init-1',
    type: 'initial',
    themes: ['fantasy', 'scifi', 'western', 'sitcom', 'adventure', 'mystery'],
    tags: ['beginning', 'universal'],
    content: 'A new chapter of your story begins. The path ahead is uncertain, but filled with possibility. You take a deep breath and prepare to face whatever comes next.',
    choices: [
      { text: 'Move forward with confidence', outcome: 'You step forward boldly, ready to embrace the challenges ahead.', tags: ['confident', 'forward'] },
      { text: 'Proceed with caution', outcome: 'You advance carefully, alert to any signs of danger or opportunity.', tags: ['cautious', 'observant'] },
      { text: 'Take a moment to prepare', outcome: 'You pause to gather your thoughts and check your equipment before proceeding.', tags: ['preparation', 'thoughtful'] }
    ],
    weight: 0.5 // Lower weight so theme-specific content is preferred
  },

  {
    id: 'generic-transition-1',
    type: 'transition',
    themes: ['fantasy', 'scifi', 'western', 'sitcom', 'adventure', 'mystery'],
    tags: ['travel', 'time_pass'],
    content: 'Time passes as you continue your journey. Each moment brings new experiences, and you find yourself changed by the challenges you\'ve faced. The adventure continues...',
    weight: 0.5
  },

  {
    id: 'generic-scene-1',
    type: 'scene',
    themes: ['fantasy', 'scifi', 'western', 'sitcom', 'adventure', 'mystery'],
    tags: ['exploration', 'discovery'],
    content: 'You discover something unexpected - a detail that had escaped your notice before. This revelation opens new possibilities and raises new questions. How will you proceed?',
    choices: [
      { text: 'Investigate further', outcome: 'You decide to examine this discovery more closely, seeking to understand its significance.', tags: ['investigate', 'curious'] },
      { text: 'Make note and continue', outcome: 'You file this information away for later consideration and continue with your current objective.', tags: ['practical', 'focused'] }
    ],
    weight: 0.5
  },

  {
    id: 'generic-choice-1',
    type: 'choice',
    themes: ['fantasy', 'scifi', 'western', 'sitcom', 'adventure', 'mystery'],
    tags: ['decision', 'crossroads'],
    content: 'You stand at a crossroads, both literal and metaphorical. The decision before you will shape the path ahead. Each option holds promise and peril in equal measure.',
    choices: [
      { text: 'Choose the familiar path', outcome: 'You opt for the known route, finding comfort in its familiarity.', tags: ['safe', 'known'] },
      { text: 'Take the unknown path', outcome: 'You choose the mysterious option, drawn by the promise of discovery.', tags: ['adventurous', 'unknown'] },
      { text: 'Forge your own path', outcome: 'You decide neither option suits you and create your own way forward.', tags: ['independent', 'creative'] }
    ],
    weight: 0.5
  }
];