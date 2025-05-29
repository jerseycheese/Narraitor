import type { Meta, StoryObj } from '@storybook/react';
import { GameStartWizard } from './GameStartWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';

const meta: Meta<typeof GameStartWizard> = {
  title: 'Narraitor/Navigation/GameStartWizard',
  component: GameStartWizard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Unified game start wizard that guides users through world selection, character selection, and game initialization.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-100 p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    initialWorldId: {
      control: 'text',
      description: 'Pre-select a world ID to skip world selection step',
    },
    initialCharacterId: {
      control: 'text',
      description: 'Pre-select a character ID to skip character selection step',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Called when wizard is cancelled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockWorlds = {
  'world-1': {
    id: 'world-1',
    name: 'The Enchanted Realm',
    description: 'A magical world filled with wonder and ancient mysteries',
    theme: 'fantasy' as const,
    attributes: [
      { id: 'attr-1', name: 'Strength', category: 'physical' },
      { id: 'attr-2', name: 'Intelligence', category: 'mental' },
    ],
    skills: [
      { id: 'skill-1', name: 'Swordsmanship', category: 'combat' },
      { id: 'skill-2', name: 'Magic', category: 'arcane' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'world-2': {
    id: 'world-2',
    name: 'Cyberpunk 2087',
    description: 'A dystopian future where technology and humanity collide',
    theme: 'cyberpunk' as const,
    attributes: [
      { id: 'attr-3', name: 'Reflexes', category: 'physical' },
      { id: 'attr-4', name: 'Technical', category: 'mental' },
    ],
    skills: [
      { id: 'skill-3', name: 'Hacking', category: 'tech' },
      { id: 'skill-4', name: 'Combat', category: 'physical' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const mockCharacters = {
  'char-1': {
    id: 'char-1',
    worldId: 'world-1',
    name: 'Aria the Brave',
    background: {
      history: 'A courageous warrior from the northern kingdoms',
      personality: 'Bold, adventurous, and fiercely loyal to friends',
      physicalDescription: 'Tall with flowing red hair and piercing green eyes',
      goals: ['Restore peace to the realm'],
      fears: ['Losing those she protects'],
      relationships: [],
    },
    attributes: [],
    skills: [],
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 100,
      categories: [],
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Starting Village',
    },
    portrait: { type: 'placeholder' as const, url: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'char-2': {
    id: 'char-2',
    worldId: 'world-1',
    name: 'Zephyr the Wise',
    background: {
      history: 'An ancient wizard with knowledge of forgotten spells',
      personality: 'Thoughtful, patient, and mysteriously wise',
      physicalDescription: 'Elderly with a long white beard and twinkling blue eyes',
      goals: ['Preserve ancient knowledge'],
      fears: ['The loss of magic from the world'],
      relationships: [],
    },
    attributes: [],
    skills: [],
    inventory: {
      characterId: 'char-2',
      items: [],
      capacity: 100,
      categories: [],
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Wizard Tower',
    },
    portrait: { type: 'placeholder' as const, url: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'char-3': {
    id: 'char-3',
    worldId: 'world-2',
    name: 'Nova Chen',
    background: {
      history: 'A skilled netrunner fighting corporate oppression',
      personality: 'Quick-witted, rebellious, and tech-savvy',
      physicalDescription: 'Lean build with cybernetic implants and neon hair',
      goals: ['Take down the megacorps'],
      fears: ['Being trapped in cyberspace'],
      relationships: [],
    },
    attributes: [],
    skills: [],
    inventory: {
      characterId: 'char-3',
      items: [],
      capacity: 100,
      categories: [],
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Underground Hideout',
    },
    portrait: { type: 'placeholder' as const, url: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const DefaultFlow: Story = {
  name: 'Default Flow (Start from World Selection)',
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: mockWorlds,
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: mockCharacters 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    onCancel: undefined,
  },
};

export const WithWorldPreselected: Story = {
  name: 'With World Pre-selected',
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: mockWorlds,
        currentWorldId: 'world-1'
      });
      characterStore.setState({ 
        characters: mockCharacters 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    initialWorldId: 'world-1',
    onCancel: undefined,
  },
};

export const WithCharacterPreselected: Story = {
  name: 'With Character Pre-selected',
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: mockWorlds,
        currentWorldId: 'world-1'
      });
      characterStore.setState({ 
        characters: mockCharacters 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    initialWorldId: 'world-1',
    initialCharacterId: 'char-1',
    onCancel: undefined,
  },
};

export const NoWorlds: Story = {
  name: 'No Worlds Available',
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: {},
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: {} 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    onCancel: undefined,
  },
};

export const NoCharactersForWorld: Story = {
  name: 'No Characters for Selected World',
  decorators: [
    (Story) => {
      // World with no characters
      const worldWithoutChars = {
        'world-empty': {
          id: 'world-empty',
          name: 'Empty Realm',
          description: 'A world waiting for its first hero',
          theme: 'fantasy' as const,
          attributes: [],
          skills: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
      
      worldStore.setState({ 
        worlds: worldWithoutChars,
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: {} 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    initialWorldId: 'world-empty',
    onCancel: undefined,
  },
};

export const WithCancelButton: Story = {
  name: 'With Cancel Button',
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: mockWorlds,
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: mockCharacters 
      });
      sessionStore.setState({ 
        savedSessions: {},
        initializeSession: (worldId: string, characterId: string, callback?: () => void) => {
          console.log('Initializing session:', { worldId, characterId });
          setTimeout(() => callback?.(), 1000);
        }
      });
      
      return <Story />;
    },
  ],
  args: {
    onCancel: () => console.log('Wizard cancelled!'),
  },
};