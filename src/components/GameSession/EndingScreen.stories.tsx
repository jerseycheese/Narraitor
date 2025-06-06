// src/components/GameSession/EndingScreen.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { EndingScreen } from './EndingScreen';
import { useNarrativeStore } from '../../state/narrativeStore';
import { useCharacterStore } from '../../state/characterStore';
import { useWorldStore } from '../../state/worldStore';
import type { StoryEnding } from '../../types/narrative.types';

const meta: Meta<typeof EndingScreen> = {
  title: 'Narraitor/Game/EndingScreen',
  component: EndingScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Story ending screen that provides narrative closure with AI-generated epilogue, character legacy, and world impact. Uses shared components and existing tone-based styling.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof EndingScreen>;

// Mock data
const mockCharacter = {
  id: 'char-123',
  name: 'Aria Stormblade',
  description: 'A seasoned warrior seeking redemption',
  worldId: 'world-456',
  level: 10,
  isPlayer: true,
  attributes: [
    {
      id: 'char-attr-1',
      characterId: 'char-123',
      name: 'Strength',
      baseValue: 15,
      modifiedValue: 15,
      category: 'Physical',
    },
  ],
  skills: [
    {
      id: 'char-skill-1',
      characterId: 'char-123',
      name: 'Swordsmanship',
      level: 7,
      category: 'Combat',
    },
  ],
  background: {
    history: 'A seasoned warrior seeking redemption',
    personality: 'Brave and honorable',
    goals: ['Defeat the dark lord and restore peace'],
    fears: ['Losing those she protects'],
    physicalDescription: 'Tall and strong with weathered features',
    relationships: []
  },
  portrait: {
    type: 'placeholder' as const,
    url: null
  },
  status: {
    health: 100,
    maxHealth: 100,
    conditions: []
  },
  inventory: {
    characterId: 'char-123',
    items: [],
    capacity: 20,
    categories: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockWorld = {
  id: 'world-456',
  name: 'Eldoria',
  description: 'A realm where magic and technology coexist',
  theme: 'High Fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Base ending for variations
const baseEnding: Omit<StoryEnding, 'tone'> = {
  id: 'ending-789',
  sessionId: 'session-123',
  characterId: 'char-123',
  worldId: 'world-456',
  type: 'story-complete',
  epilogue: `As the sun set over the kingdom of Eldoria, Aria Stormblade stood atop the highest tower of the royal castle, her sword finally at rest. The dark lord had fallen, his shadow armies scattered to the winds, and peace had returned to the realm.

The scars of battle marked both the land and its people, but they were healing. In the distance, she could see farmers returning to their fields, merchants reopening their shops, and children playing in the streets once more. The long nightmare was over.

Aria smiled as she felt the weight of her destiny finally lifting from her shoulders. She had found the redemption she sought, not in the glory of victory, but in the simple joy of seeing her people safe and free.`,
  characterLegacy: `Aria Stormblade would be remembered not just as the warrior who defeated the dark lord, but as the hero who chose mercy over vengeance. Tales of her final confrontation would be sung for generations - how she offered her fallen enemy a chance at redemption, even in his darkest hour.

Her name became synonymous with honor and courage throughout Eldoria. Young warriors would train in her footsteps, and her teachings about finding strength in compassion would shape the kingdom's values for centuries to come.`,
  worldImpact: `The defeat of the dark lord marked the beginning of a new golden age for Eldoria. With the shadow of evil lifted, the realm flourished like never before. Magic and technology advanced hand in hand, creating wonders that benefited all citizens, not just the privileged few.

The alliances forged during the dark times grew stronger, uniting neighboring kingdoms in lasting peace. Eldoria became a beacon of hope for other realms struggling against their own darkness, proving that even the deepest shadows could be overcome through courage and unity.`,
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  achievements: [
    'Dragon Slayer',
    'Savior of Eldoria', 
    'Peacekeeper',
    'Master Warrior',
    'Hero of the Realm'
  ],
  playTime: 7200 // 2 hours
};

// Story decorator to set up store state
const withEndingState = (ending: StoryEnding) => {
  const EndingStateDecorator = (Story: React.ComponentType) => {
  // Mock the stores
  useNarrativeStore.setState({
    currentEnding: ending,
    isGeneratingEnding: false,
    endingError: null
  });

  useCharacterStore.setState({
    characters: { 'char-123': mockCharacter }
  });

  useWorldStore.setState({
    worlds: { 'world-456': mockWorld }
  });

  return <Story />;
};
  return EndingStateDecorator;
};

export const Triumphant: Story = {
  decorators: [withEndingState({
    ...baseEnding,
    tone: 'triumphant'
  })],
  parameters: {
    docs: {
      description: {
        story: 'A triumphant ending celebrating victory and achievement.'
      }
    }
  }
};

export const Bittersweet: Story = {
  decorators: [withEndingState({
    ...baseEnding,
    tone: 'bittersweet',
    epilogue: `Victory came at a great cost. As Aria stood among the ruins of the final battle, she counted the friends who would not see this new dawn. The dark lord was defeated, but the price of peace weighed heavily on her heart.

She had saved the kingdom, but lost pieces of herself along the way. The innocent girl who had first taken up her sword was gone, replaced by a warrior who understood that some battles leave scars that never truly heal.

Yet as she watched the sunrise paint the sky in brilliant colors, Aria found hope. The world would remember the fallen, honor their sacrifice, and build something beautiful from the ashes of war.`,
    characterLegacy: `Aria Stormblade's legacy was complex - a hero who saved the world but carried the weight of necessary sacrifices. Her story became a lesson about the true cost of heroism, teaching that courage isn't the absence of pain, but the choice to act despite it.

Veterans of the war would seek her counsel, finding in her someone who understood their struggles. Her quiet moments of grief became as legendary as her moments of triumph, showing that true strength included the willingness to feel deeply.`,
    worldImpact: `Eldoria's victory ushered in an era of somber prosperity. The kingdom rebuilt stronger than before, but never forgot the price of freedom. Monuments to the fallen stood in every city, and their stories were woven into the very fabric of the new society.

The realm's approach to conflict changed forever. Diplomacy became the first choice, not the last, as leaders remembered the devastating cost of the shadow war and vowed to never let such darkness take root again.`,
    achievements: [
      'Pyrrhic Victory',
      'The Burden Bearer',
      'Last Stand Hero',
      'Keeper of Memory',
      'Guardian of Peace'
    ]
  })],
  parameters: {
    docs: {
      description: {
        story: 'A bittersweet ending that combines victory with meaningful loss.'
      }
    }
  }
};

export const Mysterious: Story = {
  decorators: [withEndingState({
    ...baseEnding,
    tone: 'mysterious',
    epilogue: `The final battle ended not with clash of steel, but with whispered words in an ancient tongue. As the dark lord fell, his form began to shimmer and fade, revealing something impossible - he bore Aria's own face, twisted by shadow and time.

"You understand now," he gasped with his final breath. "We are two sides of the same coin, forged in different fires."

Aria felt reality shift around her as memories that weren't her own flooded her mind. The victory was complete, but the truth it revealed opened doors to questions she wasn't sure she wanted answered. The prophecy spoke of a chosen one, but it never mentioned what happened after the choosing was done.`,
    characterLegacy: `The full truth of Aria Stormblade's destiny remained shrouded in mystery. Some claimed she ascended to become a guardian between worlds. Others whispered that she ventured into the spaces between realities, seeking answers to the riddle of her existence.

Her legend grew in the telling, becoming more myth than history. What was certain was that her sacrifice had meaning beyond the simple defeat of evil - she had stepped into a larger pattern, one that touched the very foundations of existence itself.`,
    worldImpact: `Eldoria prospered, but the kingdom was forever changed by mysteries that Aria's victory had unveiled. Ancient texts were studied with new urgency, and scholars detected patterns in history that suggested cycles repeating across millennia.

The realm became a center of learning for those seeking to understand the deeper mysteries of existence. What had seemed like a simple tale of good versus evil revealed itself as one thread in an incomprehensible tapestry that spanned worlds and ages.`,
    achievements: [
      'Paradox Resolver', 
      'Walker Between Worlds',
      'Truth Seeker',
      'Pattern Breaker',
      'Guardian of Mysteries'
    ]
  })],
  parameters: {
    docs: {
      description: {
        story: 'A mysterious ending that leaves questions unanswered and opens new possibilities.'
      }
    }
  }
};

export const Tragic: Story = {
  decorators: [withEndingState({
    ...baseEnding,
    tone: 'tragic',
    epilogue: `The price of victory was everything. As Aria struck the killing blow against the dark lord, she felt her own life force being drawn away - the ancient magic demanded a soul for a soul, a truth the prophecies had hidden in their cryptic verses.

She collapsed beside her fallen enemy, her strength ebbing like the tide. Around her, the shadow armies crumbled to dust, and the cursed lands began to heal. The kingdom was saved, but its savior would not live to see the peace she had bought with her blood.

With her final breath, Aria whispered a prayer for those she was leaving behind. The sunrise broke over a free Eldoria, painting the sky in colors that seemed to honor her sacrifice. The darkness was gone forever, but so was the light she had carried within her.`,
    characterLegacy: `Aria Stormblade became Eldoria's greatest martyr, her sacrifice inspiring generations to come. Her tomb in the capital became a place of pilgrimage, where people came to remember that freedom's price is often paid by those who will never enjoy it.

Her story was told to children as both inspiration and warning - that heroism sometimes demands everything, but that such sacrifice is what separates the truly great from the merely ambitious. Schools were built in her name, teaching that service to others is the highest calling.`,
    worldImpact: `Eldoria emerged from the shadow war transformed by sacrifice. The kingdom became a realm where selflessness was the highest virtue, where leaders were chosen not for their ambition but for their willingness to serve others before themselves.

A new order rose from the ashes, one dedicated to ensuring that no future hero would have to pay the price that Aria paid. The realm's scholars worked tirelessly to find ways to break such cruel magics, vowing that her sacrifice would be the last of its kind.`,
    achievements: [
      'Ultimate Sacrifice',
      'Martyr of Eldoria',
      'Soul-Price Payer',
      'The Final Light',
      'Eternal Guardian'
    ]
  })],
  parameters: {
    docs: {
      description: {
        story: 'A tragic ending where victory comes at the ultimate cost.'
      }
    }
  }
};

export const Hopeful: Story = {
  decorators: [withEndingState({
    ...baseEnding,
    tone: 'hopeful',
    epilogue: `The dark lord's defeat was only the beginning. As his shadow lifted from the land, Aria discovered that the true magic of Eldoria wasn't in ancient spells or mighty weapons - it was in the connections between people, the bonds that had grown stronger in the darkness.

Standing before the assembled citizens of the realm, she made a choice that surprised everyone, including herself. She laid down her sword and picked up a teacher's staff, choosing to guide the next generation rather than rule them.

"Our greatest victories," she announced to the cheering crowd, "are not the enemies we defeat, but the friends we lift up along the way." The future stretched before them, bright with possibility and rich with the promise of adventures yet to come.`,
    characterLegacy: `Aria Stormblade's greatest achievement wasn't defeating the dark lord - it was showing an entire kingdom how to grow beyond their need for heroes. She became the realm's first Teacher-Guardian, establishing schools where young people learned not just to fight, but to dream, create, and build.

Her methods spread to other kingdoms, sparking a renaissance of learning and growth. The warrior who had saved one world became the teacher who helped countless others save themselves, proving that the most powerful magic is the ability to inspire others to greatness.`,
    worldImpact: `Eldoria blossomed into an age of unprecedented prosperity and creativity. With Aria's guidance, the kingdom became known throughout the land as a place where anyone could come to learn, grow, and discover their own potential.

The realm's approach to challenges shifted from combat to collaboration. Problems that once would have required heroes to solve were instead addressed by communities working together, creating solutions that were both more effective and more lasting than any sword could provide.`,
    achievements: [
      'Kingdom\'s Teacher',
      'Hope Bringer',
      'Future Builder',
      'Community Creator',
      'Inspiration to All'
    ]
  })],
  parameters: {
    docs: {
      description: {
        story: 'A hopeful ending that emphasizes growth, learning, and building a better future.'
      }
    }
  }
};

