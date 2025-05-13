import type { Meta, StoryObj } from '@storybook/react';
import { ContextPreview } from './ContextPreview';
import { createMockWorld, createMockCharacter } from '../__tests__/test-helpers';

export default {
  title: 'Narraitor/Context/ContextPreview',
  component: ContextPreview,
  parameters: {
    docs: {
      description: {
        component: 'Displays AI prompt context with token management metrics and prioritization features'
      }
    }
  }
} as Meta<typeof ContextPreview>;

type Story = StoryObj<typeof ContextPreview>;

// Create a large mock world with more content to demonstrate truncation
const createLargeWorld = () => {
  const baseWorld = createMockWorld();
  return {
    ...baseWorld,
    description: `${baseWorld.description || ''} This is an extended description with much more content to demonstrate token management features.
    The world of Eldoria is a vast continent with diverse landscapes ranging from the frozen north to the scorching deserts of the south.
    The central kingdoms are lush with forests and fertile farmlands, while the eastern coast features dramatic cliffs and bustling port cities.
    Magic flows through the land, strongest near the ancient ruins scattered throughout the wilderness.
    The political landscape is equally diverse, with feuding noble houses, merchant guilds, and arcane colleges all vying for influence.
    The history of Eldoria spans thousands of years, from the Age of Dragons to the current Era of Restoration following the Calamity War.
    Numerous factions compete for power, including the Royal Court, the Mages' Conclave, the Thieves' Guild, and the mysterious Order of the Veil.`,
    history: `The world was formed when the god Aethus dreamed the cosmos into existence. The first age was the Age of Wonder, when magic flowed freely.
    Then came the Age of Heroes, when legendary figures shaped the land. The Dark Times followed, a period of war and suffering.
    The current age is known as the Age of Renewal, as the world rebuilds from past conflicts.
    Notable historical events include the Battle of Shattered Peak, the Sundering of the Veil, the Great Plague, and the Coronation of the Eternal Emperor.`
  };
};

// Create a detailed character with more content
const createDetailedCharacter = () => {
  const baseCharacter = createMockCharacter();
  return {
    ...baseCharacter,
    description: `${baseCharacter.description || ''} A veteran adventurer with a troubled past and a heart of gold.
    Standing six feet tall with broad shoulders and weather-worn features, the hero carries visible scars from countless battles.
    Despite a gruff exterior, those who earn the hero's trust find a loyal ally and compassionate friend.
    Years of wandering have taught the hero to value freedom and justice above all else.`,
    backstory: `Born in a small village on the edge of the kingdom, the hero's early life was disrupted when raiders destroyed their home.
    Taken in by a retired soldier, they learned the ways of combat and survival.
    As a young adult, they joined the royal guard but became disillusioned with corruption in the ranks.
    After uncovering a plot against the crown, they were falsely accused of treason and forced to flee.
    Now they travel the land, righting wrongs and searching for a way to clear their name.`
  };
};

// Generate a large array of recent events
const generateManyEvents = (count: number) => {
  return Array(count).fill(null).map((_, i) =>
    `Event ${i+1}: The hero encountered a ${['mysterious stranger', 'dangerous beast', 'magical anomaly', 'lost traveler', 'ancient artifact'][i % 5]} in the ${['forest', 'mountains', 'desert', 'swamp', 'ruins'][i % 5]} and ${['defeated it in combat', 'solved a difficult puzzle', 'negotiated a peaceful resolution', 'discovered a valuable secret', 'made a powerful ally'][i % 5]}.`
  );
};

export const Default: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    tokenLimit: 500,
    showTokenCount: true,
    showWarning: true
  }
};

export const WithTokenMetrics: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave'
    ],
    tokenLimit: 500,
    showTokenCount: true,
    showWarning: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays token metrics including estimated count, final count, and retention percentage'
      }
    }
  }
};

export const MinimalContext: Story = {
  args: {
    world: { id: 'world-1', name: 'Simple World' },
    character: { id: 'char-1', name: 'Hero' },
    showTokenCount: true
  }
};

export const WithRecentEvents: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave'
    ],
    showTokenCount: true
  }
};

export const TokenLimitExceeded: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    tokenLimit: 50,
    showTokenCount: true,
    showWarning: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows what happens when the token limit is exceeded'
      }
    }
  }
};

export const HighTruncation: Story = {
  args: {
    world: createLargeWorld(),
    character: createDetailedCharacter(),
    recentEvents: generateManyEvents(10),
    tokenLimit: 100,
    showTokenCount: true,
    showWarning: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates significant truncation with low retention percentage'
      }
    }
  }
};

export const ModerateTruncation: Story = {
  args: {
    world: createLargeWorld(),
    character: createDetailedCharacter(),
    recentEvents: generateManyEvents(5),
    tokenLimit: 300,
    showTokenCount: true,
    showWarning: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates moderate truncation with medium retention percentage'
      }
    }
  }
};

export const PrioritizationNarrative: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave'
    ],
    currentSituation: 'The hero stands at the entrance of a dark dungeon.',
    promptType: 'narrative',
    tokenLimit: 200,
    showTokenCount: true,
    showWarning: true,
    showPrioritizationInfo: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows prioritization for narrative prompts'
      }
    }
  }
};

export const PrioritizationDecision: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave'
    ],
    currentSituation: 'The hero must decide whether to enter the dark dungeon or return to town.',
    promptType: 'decision',
    tokenLimit: 200,
    showTokenCount: true,
    showWarning: true,
    showPrioritizationInfo: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows prioritization for decision prompts'
      }
    }
  }
};

export const PrioritizationSummary: Story = {
  args: {
    world: createMockWorld(),
    character: createMockCharacter(),
    recentEvents: [
      'Defeated the goblin king',
      'Found ancient artifact',
      'Entered mysterious cave',
      'Discovered a hidden treasure',
      'Encountered a dragon'
    ],
    currentSituation: 'The hero has completed their adventure and returns to town.',
    promptType: 'summary',
    tokenLimit: 200,
    showTokenCount: true,
    showWarning: true,
    showPrioritizationInfo: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows prioritization for summary prompts'
      }
    }
  }
};

export const RecentEventsPrioritization: Story = {
  args: {
    recentEvents: [
      'Old event from long ago that is less important',
      'Very recent important event that should be kept'
    ],
    tokenLimit: 50,
    showTokenCount: true,
    showWarning: true,
    showPrioritizationInfo: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates prioritization of recent events over older ones'
      }
    }
  }
};

export const ImportantContentPrioritization: Story = {
  args: {
    world: createMockWorld(),
    recentEvents: ['Minor lore detail that is low priority.'],
    tokenLimit: 100,
    showTokenCount: true,
    showWarning: true,
    showPrioritizationInfo: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates prioritization of important content over less important content'
      }
    }
  }
};
