import type { Character } from '@/types/character.types';

/**
 * Test fixture data for Character entities
 * Used in visual regression tests and integration tests
 */

export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'char-cyberpunk-hacker',
    name: 'Nova "Ghost" Chen',
    description: 'Elite corporate hacker turned underground resistance fighter',
    worldId: 'world-cyberpunk-2077',
    attributes: [
      {
        attributeId: 'attr-world-cyberpunk-2077-1', // Tech Level
        value: 8,
      },
      {
        attributeId: 'attr-world-cyberpunk-2077-2', // Street Cred
        value: 6,
      },
    ],
    skills: [
      {
        skillId: 'skill-world-cyberpunk-2077-1', // Hacking
        level: 12,
        experience: 0,
        isActive: true,
      },
      {
        skillId: 'skill-world-cyberpunk-2077-2', // Streetwise
        level: 8,
        experience: 0,
        isActive: true,
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
      categories: ['Tech', 'Weapons', 'Data'],
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
    attributes: [
      {
        attributeId: 'attr-world-cyberpunk-2077-1', // Tech Level
        value: 5,
      },
      {
        attributeId: 'attr-world-cyberpunk-2077-2', // Street Cred
        value: 7,
      },
    ],
    skills: [
      {
        skillId: 'skill-world-cyberpunk-2077-1', // Hacking (placeholder)
        level: 6,
        experience: 0,
        isActive: true,
      },
      {
        skillId: 'skill-world-cyberpunk-2077-2', // Streetwise (placeholder)
        level: 5,
        experience: 0,
        isActive: true,
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
      categories: ['Tech', 'Tools'],
    },
    createdAt: '2024-01-01T01:30:00.000Z',
    updatedAt: '2024-01-01T01:30:00.000Z',
  },
  {
    id: 'char-fantasy-mage',
    name: 'Lyralei Moonwhisper',
    description: 'Young elven archmage seeking to restore balance to the realm',
    worldId: 'world-fantasy-realm',
    attributes: [
      {
        attributeId: 'attr-world-fantasy-realm-1', // Magic Power
        value: 9,
      },
      {
        attributeId: 'attr-world-fantasy-realm-2', // Noble Standing
        value: 4,
      },
    ],
    skills: [
      {
        skillId: 'skill-world-fantasy-realm-1', // Spellcasting
        level: 14,
        experience: 0,
        isActive: true,
      },
      {
        skillId: 'skill-world-fantasy-realm-2', // Dragon Lore
        level: 7,
        experience: 0,
        isActive: true,
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
      categories: ['Magical Items', 'Scrolls', 'Reagents'],
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
    attributes: [
      {
        attributeId: 'attr-world-fantasy-realm-1', // Magic Power
        value: 3,
      },
      {
        attributeId: 'attr-world-fantasy-realm-2', // Noble Standing
        value: 1,
      },
    ],
    skills: [
      {
        skillId: 'skill-world-fantasy-realm-1', // Spellcasting (minimal)
        level: 2,
        experience: 0,
        isActive: true,
      },
      {
        skillId: 'skill-world-fantasy-realm-2', // Dragon Lore
        level: 9,
        experience: 0,
        isActive: true,
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
      categories: ['Gear', 'Supplies'],
    },
    createdAt: '2024-01-02T01:15:00.000Z',
    updatedAt: '2024-01-02T01:15:00.000Z',
  },
];
