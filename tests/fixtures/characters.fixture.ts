import type { Character } from '@/state/characterStore';

/**
 * Test fixture data for Character entities
 * Uses the store shape (not domain type) for visual regression tests
 */

export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'char-cyberpunk-hacker',
    name: 'Nova "Ghost" Chen',
    description: 'Elite corporate hacker turned underground resistance fighter',
    worldId: 'world-cyberpunk-2077',
    level: 3,
    isPlayer: true,
    attributes: [
      {
        id: 'char-attr-tech-level',
        characterId: 'char-cyberpunk-hacker',
        worldAttributeId: 'attr-world-cyberpunk-2077-1',
        name: 'Tech Level',
        baseValue: 8,
        modifiedValue: 8,
      },
      {
        id: 'char-attr-street-cred',
        characterId: 'char-cyberpunk-hacker',
        worldAttributeId: 'attr-world-cyberpunk-2077-2',
        name: 'Street Cred',
        baseValue: 6,
        modifiedValue: 6,
      },
    ],
    skills: [
      {
        id: 'char-skill-hacking',
        characterId: 'char-cyberpunk-hacker',
        worldSkillId: 'skill-world-cyberpunk-2077-1',
        name: 'Hacking',
        level: 12,
      },
      {
        id: 'char-skill-streetwise',
        characterId: 'char-cyberpunk-hacker',
        worldSkillId: 'skill-world-cyberpunk-2077-2',
        name: 'Streetwise',
        level: 8,
      },
    ],
    background: {
      history:
        'Former Arasaka security specialist who discovered dark corporate secrets',
      personality: 'Cynical but loyal, values freedom over security',
      goals: ['Expose corporate corruption', 'Protect the innocent'],
      fears: ['Corporate retaliation', 'Loss of freedom'],
      physicalDescription:
        'Lean build with cybernetic eye implant and neural interface ports',
      relationships: [],
      isKnownFigure: false,
    },
    status: {
      health: 85,
      maxHealth: 100,
      conditions: ['Cybernetic Enhancement'],
      location: 'Neo-Tokyo Underground',
    },
    inventory: {
      characterId: 'char-cyberpunk-hacker',
      items: [],
      capacity: 15,
      categories: [],
      itemOrder: [],
    },
    portrait: {
      type: 'ai-generated',
      url: '/visual-assets/portrait-cyberpunk.png',
      generatedAt: '2024-01-01T01:00:00.000Z',
      prompt: 'Cyberpunk hacker with tech augments',
    },
    createdAt: '2024-01-01T01:00:00.000Z',
    updatedAt: '2024-01-01T01:00:00.000Z',
  },
  // Cyberpunk character without portrait (to validate empty portrait state)
  {
    id: 'char-cyberpunk-operative',
    name: 'Kade "Null" Armitage',
    description: 'Field operative who prefers to stay off-grid',
    worldId: 'world-cyberpunk-2077',
    level: 2,
    isPlayer: false,
    attributes: [
      {
        id: 'char-attr-tech-level-2',
        characterId: 'char-cyberpunk-operative',
        worldAttributeId: 'attr-world-cyberpunk-2077-1',
        name: 'Tech Level',
        baseValue: 5,
        modifiedValue: 5,
      },
      {
        id: 'char-attr-street-cred-2',
        characterId: 'char-cyberpunk-operative',
        worldAttributeId: 'attr-world-cyberpunk-2077-2',
        name: 'Street Cred',
        baseValue: 7,
        modifiedValue: 7,
      },
    ],
    skills: [
      {
        id: 'char-skill-hacking-2',
        characterId: 'char-cyberpunk-operative',
        worldSkillId: 'skill-world-cyberpunk-2077-1',
        name: 'Hacking',
        level: 6,
      },
      {
        id: 'char-skill-streetwise-2',
        characterId: 'char-cyberpunk-operative',
        worldSkillId: 'skill-world-cyberpunk-2077-2',
        name: 'Streetwise',
        level: 5,
      },
    ],
    background: {
      history:
        'A former corporate asset who disappeared from official records.',
      personality: 'Quiet, calculated, and resourceful',
      goals: ['Protect their identity', 'Expose corruption'],
      fears: ['Being tracked', 'Compromised safehouses'],
      physicalDescription: 'Athletic build with muted cybernetic enhancements',
      relationships: [],
      isKnownFigure: false,
    },
    status: {
      health: 90,
      maxHealth: 100,
      conditions: [],
      location: 'Unknown',
    },
    inventory: {
      characterId: 'char-cyberpunk-operative',
      items: [],
      capacity: 15,
      categories: [],
      itemOrder: [],
    },
    createdAt: '2024-01-01T01:30:00.000Z',
    updatedAt: '2024-01-01T01:30:00.000Z',
  },
  {
    id: 'char-fantasy-mage',
    name: 'Lyralei Moonwhisper',
    description: 'Young elven archmage seeking to restore balance to the realm',
    worldId: 'world-fantasy-realm',
    level: 4,
    isPlayer: true,
    attributes: [
      {
        id: 'char-attr-magic-power',
        characterId: 'char-fantasy-mage',
        worldAttributeId: 'attr-world-fantasy-realm-1',
        name: 'Magic Power',
        baseValue: 9,
        modifiedValue: 9,
      },
      {
        id: 'char-attr-noble-standing',
        characterId: 'char-fantasy-mage',
        worldAttributeId: 'attr-world-fantasy-realm-2',
        name: 'Noble Standing',
        baseValue: 4,
        modifiedValue: 4,
      },
    ],
    skills: [
      {
        id: 'char-skill-spellcasting',
        characterId: 'char-fantasy-mage',
        worldSkillId: 'skill-world-fantasy-realm-1',
        name: 'Spellcasting',
        level: 14,
      },
      {
        id: 'char-skill-lore',
        characterId: 'char-fantasy-mage',
        worldSkillId: 'skill-world-fantasy-realm-2',
        name: 'Dragon Lore',
        level: 7,
      },
    ],
    background: {
      history: 'Trained in the ancient towers of Silverwind Academy',
      personality:
        'Wise beyond her years, passionate about preserving magical knowledge',
      goals: ['Restore magical balance', 'Preserve ancient knowledge'],
      fears: ['Loss of magic', 'Corruption of nature'],
      physicalDescription:
        'Tall and graceful with silver hair and luminous blue eyes',
      relationships: [],
      isKnownFigure: false,
    },
    status: {
      health: 95,
      maxHealth: 100,
      conditions: ['Magical Aura'],
      location: 'Silverwind Academy',
    },
    inventory: {
      characterId: 'char-fantasy-mage',
      items: [],
      capacity: 12,
      categories: [],
      itemOrder: [],
    },
    createdAt: '2024-01-02T01:00:00.000Z',
    updatedAt: '2024-01-02T01:00:00.000Z',
  },
  // Fantasy character with portrait (to validate has-image state)
  {
    id: 'char-fantasy-ranger',
    name: 'Thalen Oakstride',
    description: 'Ranger of Aethermoor sworn to protect ancient paths',
    worldId: 'world-fantasy-realm',
    level: 2,
    isPlayer: false,
    attributes: [
      {
        id: 'char-attr-magic-power-2',
        characterId: 'char-fantasy-ranger',
        worldAttributeId: 'attr-world-fantasy-realm-1',
        name: 'Magic Power',
        baseValue: 3,
        modifiedValue: 3,
      },
      {
        id: 'char-attr-noble-standing-2',
        characterId: 'char-fantasy-ranger',
        worldAttributeId: 'attr-world-fantasy-realm-2',
        name: 'Noble Standing',
        baseValue: 1,
        modifiedValue: 1,
      },
    ],
    skills: [
      {
        id: 'char-skill-spellcasting-2',
        characterId: 'char-fantasy-ranger',
        worldSkillId: 'skill-world-fantasy-realm-1',
        name: 'Spellcasting',
        level: 2,
      },
      {
        id: 'char-skill-lore-2',
        characterId: 'char-fantasy-ranger',
        worldSkillId: 'skill-world-fantasy-realm-2',
        name: 'Dragon Lore',
        level: 9,
      },
    ],
    background: {
      history: 'Guardian of the greenways and hidden glades of Aethermoor.',
      personality: 'Stoic, perceptive, and loyal',
      goals: ['Protect the realm', 'Preserve ancient lore'],
      fears: ['Blight of the old forest', 'Waning magic'],
      physicalDescription: 'Tall, hooded figure with keen eyes and steady aim',
      relationships: [],
      isKnownFigure: false,
    },
    portrait: {
      type: 'ai-generated',
      url: '/visual-assets/portrait-fantasy.png',
      generatedAt: '2024-01-02T01:15:00.000Z',
      prompt: 'Ranger portrait',
    },
    status: {
      health: 95,
      maxHealth: 100,
      conditions: [],
      location: 'Forest Edge',
    },
    inventory: {
      characterId: 'char-fantasy-ranger',
      items: [],
      capacity: 12,
      categories: [],
      itemOrder: [],
    },
    createdAt: '2024-01-02T01:15:00.000Z',
    updatedAt: '2024-01-02T01:15:00.000Z',
  },
];
