import type { Meta, StoryObj } from '@storybook/react';
import GameSessionActive from './GameSessionActive';
import { World } from '@/types/world.types';

const meta: Meta<typeof GameSessionActive> = {
  title: 'Narraitor/Game/Session/GameSessionActive',
  component: GameSessionActive,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onChoiceSelected: { action: 'choice selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockWorld: World = {
  id: 'fantasy-world',
  name: 'The Realm of Shadows',
  description: 'A dark fantasy world filled with mystery',
  theme: 'Dark Fantasy',
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

export const Default: Story = {
  args: {
    narrative: {
      text: 'You are in a dimly lit tavern. The air is thick with smoke and the scent of ale. A mysterious figure sits in the corner, watching you.',
      choices: [
        { id: 'choice-1', text: 'Talk to the mysterious figure' },
        { id: 'choice-2', text: 'Order a drink from the bartender' },
        { id: 'choice-3', text: 'Leave the tavern' },
      ],
    },
    world: mockWorld,
    currentSceneId: 'tavern-scene-001',
    status: 'active',
  },
};

export const WithoutChoices: Story = {
  args: {
    narrative: {
      text: 'The mysterious figure nods at you and disappears into the shadows. The tavern falls silent.',
    },
    world: mockWorld,
    currentSceneId: 'tavern-scene-002',
    status: 'active',
  },
};

export const PausedState: Story = {
  args: {
    narrative: {
      text: 'You are in the middle of an intense conversation with the town guard.',
      choices: [
        { id: 'choice-1', text: 'Tell the truth' },
        { id: 'choice-2', text: 'Lie about your identity' },
      ],
    },
    world: mockWorld,
    currentSceneId: 'guard-post-001',
    status: 'paused',
  },
};

export const LongNarrative: Story = {
  args: {
    narrative: {
      text: `The ancient library stretches before you, its towering shelves filled with countless tomes and scrolls. Dust motes dance in the beams of light filtering through stained glass windows, casting colorful patterns across the weathered stone floor.

You can hear the faint scratching of quills and the occasional turning of pages from somewhere deeper in the library. The air smells of old parchment and leather bindings, mixed with a hint of lavender from the preservation spells.

As you move between the shelves, your footsteps echo softly in the vast space. You notice a section cordoned off with velvet ropes, marked with arcane symbols that seem to shift when you're not looking directly at them.`,
      choices: [
        { id: 'choice-1', text: 'Approach the restricted section' },
        { id: 'choice-2', text: 'Find the librarian' },
        { id: 'choice-3', text: 'Search for books on local history' },
        { id: 'choice-4', text: 'Investigate the sound of writing' },
      ],
    },
    world: mockWorld,
    currentSceneId: 'library-001',
    status: 'active',
  },
};