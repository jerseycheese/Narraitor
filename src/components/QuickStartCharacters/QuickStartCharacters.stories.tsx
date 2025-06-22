// src/components/QuickStartCharacters/QuickStartCharacters.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { QuickStartCharacters } from './QuickStartCharacters';
import { World } from '@/types/world.types';

const meta: Meta<typeof QuickStartCharacters> = {
  title: 'Narraitor/Components/QuickStartCharacters',
  component: QuickStartCharacters,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
QuickStartCharacters provides pre-generated character archetypes for immediate game start. 
This component integrates with the world creation wizard to offer players quick access to 
genre-appropriate character options.

## Features
- **Genre-Specific Archetypes**: Generates 3 character archetypes based on world genre
- **Rich Character Details**: Shows attributes, skills, personality, and motivation
- **Active State Management**: Visual feedback for character selection
- **Random Option**: Allows players to get a randomized character
- **Customization Path**: Provides alternative to create custom characters
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Professional loading experience during generation

## Usage Context
Used in the WorldCreationWizard as the final step to help players transition 
from world creation to gameplay with minimal friction.
        `,
      },
    },
  },
  argTypes: {
    world: {
      description: 'World object containing genre, attributes, skills, and other game settings',
      control: 'object',
    },
    onCharacterSelect: {
      description: 'Callback when user selects a character archetype',
      action: 'character-selected',
    },
    onCustomizeClick: {
      description: 'Callback when user chooses to customize a character',
      action: 'customize-clicked',
    },
    existingCharacterNames: {
      description: 'Array of existing character names to avoid duplicates',
      control: 'object',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample world data for stories
const fantasyWorld: World = {
  id: 'fantasy-world-1',
  name: 'Mystical Realm of Aethros',
  description: 'A magical world filled with ancient forests, towering mountains, and mystical creatures.',
  genre: 'fantasy',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  attributes: [
    { id: 'str', name: 'Strength', description: 'Physical power and might', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'int', name: 'Intelligence', description: 'Mental acuity and reasoning', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'dex', name: 'Dexterity', description: 'Agility and precision', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'con', name: 'Constitution', description: 'Health and endurance', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'wis', name: 'Wisdom', description: 'Insight and perception', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'cha', name: 'Charisma', description: 'Social influence and presence', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
  ],
  skills: [
    { id: 'combat', name: 'Combat', description: 'Skill in battle and warfare', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'magic', name: 'Magic', description: 'Understanding of mystical arts', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'stealth', name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'survival', name: 'Survival', description: 'Living off the land', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
    { id: 'diplomacy', name: 'Diplomacy', description: 'Negotiation and persuasion', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'fantasy-world-1' },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 20,
    skillPointPool: 20
  }
};

const scifiWorld: World = {
  ...fantasyWorld,
  id: 'scifi-world-1',
  name: 'Neo-Tokyo 2187',
  description: 'A cyberpunk metropolis where technology and humanity intersect in dangerous ways.',
  genre: 'sci-fi',
  attributes: [
    { id: 'agi', name: 'Agility', description: 'Speed and reflexes', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'int', name: 'Intelligence', description: 'Processing power and logic', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'tech', name: 'Technical Aptitude', description: 'Understanding of technology', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'emp', name: 'Empathy', description: 'Emotional intelligence', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
  ],
  skills: [
    { id: 'piloting', name: 'Piloting', description: 'Operating spacecraft and vehicles', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'engineering', name: 'Engineering', description: 'Building and repairing technology', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'hacking', name: 'Hacking', description: 'Infiltrating digital systems', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
    { id: 'medicine', name: 'Medicine', description: 'Healing and medical knowledge', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'scifi-world-1' },
  ],
};

const modernWorld: World = {
  ...fantasyWorld,
  id: 'modern-world-1',
  name: 'Metro City',
  description: 'A contemporary urban setting filled with mystery and intrigue.',
  genre: 'modern',
  attributes: [
    { id: 'phy', name: 'Physical', description: 'Overall physical fitness', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
    { id: 'men', name: 'Mental', description: 'Cognitive abilities', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
    { id: 'soc', name: 'Social', description: 'Interpersonal skills', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
  ],
  skills: [
    { id: 'investigation', name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
    { id: 'athletics', name: 'Athletics', description: 'Physical prowess and sports', difficulty: 'easy', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
    { id: 'technology', name: 'Technology', description: 'Using modern digital tools', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'modern-world-1' },
  ],
};

/**
 * Default story showing a fantasy world with typical archetype generation
 */
export const Fantasy: Story = {
  args: {
    world: fantasyWorld,
    existingCharacterNames: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Fantasy genre with typical archetypes like Warrior, Mage, and Scout. Shows rich character details including personality and motivation.',
      },
    },
  },
};

/**
 * Sci-fi world demonstrating different archetype types
 */
export const SciFi: Story = {
  args: {
    world: scifiWorld,
    existingCharacterNames: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Sci-fi genre featuring archetypes like Pilot, Engineer, and Medic. Demonstrates how archetypes adapt to different world themes.',
      },
    },
  },
};

/**
 * Modern world showing contemporary character types
 */
export const Modern: Story = {
  args: {
    world: modernWorld,
    existingCharacterNames: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Modern genre with archetypes like Detective, Athlete, and Scholar. Shows how the system adapts to real-world settings.',
      },
    },
  },
};

/**
 * World with existing character names to test name uniqueness
 */
export const WithExistingNames: Story = {
  args: {
    world: fantasyWorld,
    existingCharacterNames: ['Aelric', 'Bjorn', 'Gareth', 'Lyra'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates name collision avoidance when existing character names are provided. Generated characters will have unique names.',
      },
    },
  },
};

/**
 * Minimal world setup to test edge cases
 */
export const MinimalWorld: Story = {
  args: {
    world: {
      ...fantasyWorld,
      name: 'Basic World',
      description: 'A simple world for testing',
      attributes: [
        { id: 'main', name: 'Main Stat', description: 'Primary attribute', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'minimal-world' },
      ],
      skills: [
        { id: 'basic', name: 'Basic Skill', description: 'Simple skill', difficulty: 'easy', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'minimal-world' },
      ],
    },
    existingCharacterNames: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component behavior with minimal world configuration. Useful for testing edge cases and component resilience.',
      },
    },
  },
};

/**
 * Interactive story for testing all user interactions
 */
export const Interactive: Story = {
  args: {
    world: fantasyWorld,
    existingCharacterNames: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version for testing all component features: character selection, random generation, and customization navigation.',
      },
    },
  },
  play: async () => {
    // This story is meant for manual interaction testing
    console.log('Interactive story loaded. Test the following features:');
    console.log('1. Click on character cards to see selection state');
    console.log('2. Try the Random Character button');
    console.log('3. Test the Customize Character option');
    console.log('4. Observe loading states and error handling');
  },
};