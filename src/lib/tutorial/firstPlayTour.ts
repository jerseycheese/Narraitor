import { Step } from 'react-joyride';

// Targets the manuscript play surface (progressive disclosure, default ON):
// narrative + choices are always rendered, and the character sheet / inventory /
// story recap / choice history / journal now live behind the always-present
// "Character" and "Tools" HUD buttons. Steps 2-3 point at those entry points
// rather than the individual controls (which only mount once a panel/drawer is
// open), so the tour never anchors to an element that isn't on screen yet.
export const firstPlayTour: Step[] = [
  {
    target: '[data-tutorial="narrative-display"]',
    content: 'This is where your story unfolds. Read the narrative carefully as it adapts to your choices.',
    placement: 'bottom',
    // The narrative sits directly above the decision block with no reserved
    // gap (the action rail was removed -- #1750), so Joyride's default
    // placement lands the tooltip on top of the choice buttons instead of in
    // dead space below the narrative -- there isn't any. Pull it back up over
    // the narrative itself, which is what this step is describing anyway.
    offset: -140,
    data: { autoScroll: 'down' },
  },
  {
    target: '[data-tutorial="player-choices"]',
    content: 'When the story pauses, you decide what happens next. Your choices shape the world and your character\'s fate.',
    placement: 'top',
    data: { autoScroll: 'down' },
  },
  {
    target: '[data-tutorial="session-character"]',
    content: 'Open the Character panel anytime to check your stats, health, and current status.',
    placement: 'bottom',
  },
  {
    target: '[data-tutorial="session-tools"]',
    content: 'Your inventory, the Story So Far recap, your choice history, and your journal all live in here.',
    placement: 'bottom',
  },
];
