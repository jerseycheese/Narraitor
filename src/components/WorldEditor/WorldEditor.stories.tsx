import type { Meta, StoryObj } from '@storybook/react';
import WorldEditor from './WorldEditor';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';
import { fn } from '@storybook/test';

// Mock the Next.js router
const mockPush = fn();

// Mock world data
const mockWorld: World = {
  id: 'world-123',
  name: 'Fantasy Realm',
  description: 'A mystical world filled with magic and adventure',
  theme: 'High Fantasy',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'Physical',
    },
    {
      id: 'attr-2',
      worldId: 'world-123',
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'Mental',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-123',
      name: 'Athletics',
      description: 'Physical prowess',
      linkedAttributeId: 'attr-1',
      difficulty: 'medium' as SkillDifficulty,
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      category: 'Physical',
    },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 25,
    skillPointPool: 30,
  },
};

// We'll mock the worldStore in the decorators instead

const meta: Meta<typeof WorldEditor> = {
  title: 'Narraitor/World/Forms/WorldEditor',
  component: WorldEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete world editor with forms for all world aspects and save/cancel functionality',
      },
    },
    nextjs: {
      navigation: {
        push: mockPush,
      },
    },
  },
  decorators: [
    (Story) => {
      // Mock the worldStore for all stories
      const originalGetState = useWorldStore.getState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useWorldStore as any).getState = () => ({
        worlds: {
          'world-123': mockWorld,
          'world-456': {
            ...mockWorld,
            id: 'world-456',
            name: 'Sci-Fi Universe',
            theme: 'Space Opera',
          },
        },
        updateWorld: fn(),
      });
      
      const result = <Story />;
      
      // Restore original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useWorldStore as any).getState = originalGetState;
      
      return result;
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorldEditor>;

export const Default: Story = {
  args: {
    worldId: 'world-123',
  },
};

export const DifferentWorld: Story = {
  args: {
    worldId: 'world-456',
  },
};

export const NonExistentWorld: Story = {
  args: {
    worldId: 'non-existent',
  },
  decorators: [
    (Story) => {
      // Override the store mock for this story
      const originalGetState = useWorldStore.getState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useWorldStore as any).getState = () => ({
        worlds: {},
        currentWorldId: null,
        error: null,
        loading: false,
        createWorld: fn(),
        updateWorld: fn(),
        deleteWorld: fn(),
        setCurrentWorld: fn(),
        fetchWorlds: fn(),
        addAttribute: fn(),
        updateAttribute: fn(),
        removeAttribute: fn(),
        addSkill: fn(),
        updateSkill: fn(),
        removeSkill: fn(),
        updateSettings: fn(),
        reset: fn(),
        setError: fn(),
        clearError: fn(),
        setLoading: fn(),
      });
      
      const result = <Story />;
      
      // Restore original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useWorldStore as any).getState = originalGetState;
      
      return result;
    },
  ],
};
