import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeDisplay } from './NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';

const meta = {
  title: 'Narraitor/Narrative/Display/NarrativeDisplay',
  component: NarrativeDisplay,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    segment: {
      description: 'The narrative segment to display',
    },
    isLoading: {
      description: 'Whether the component is in loading state',
      control: 'boolean',
    },
    error: {
      description: 'Error message to display',
      control: 'text',
    },
  },
} satisfies Meta<typeof NarrativeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock segments
const createMockSegment = (
  content: string,
  type: NarrativeSegment['type'] = 'scene',
  metadata?: Partial<NarrativeSegment['metadata']>
): NarrativeSegment => ({
  id: 'seg-1',
  content,
  type,
  sessionId: 'session-1',
  worldId: 'world-1',
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    characterIds: [],
    tags: [],
    mood: 'neutral',
    ...metadata,
  },
});

// Scene type
export const Scene: Story = {
  args: {
    segment: createMockSegment(
      'The ancient forest whispered secrets in the moonlight. Towering trees cast long shadows across the mossy ground, their branches swaying gently in the evening breeze.',
      'scene',
      {
        location: 'Mystical Forest',
        mood: 'mysterious',
        tags: ['forest', 'night', 'mystery'],
      }
    ),
  },
};

// Dialogue type
export const Dialogue: Story = {
  args: {
    segment: createMockSegment(
      '"Welcome to the Mystical Forest," said the ethereal voice. "Few mortals find their way here without purpose. What brings you to these ancient woods?"',
      'dialogue',
      {
        characterIds: ['char-1'],
        mood: 'mysterious',
        tags: ['conversation', 'introduction'],
      }
    ),
  },
};

// Action type
export const Action: Story = {
  args: {
    segment: createMockSegment(
      'The hero leapt across the chasm with a mighty roar, the wind whipping through their hair as they soared through the air.',
      'action',
      {
        mood: 'action',
        tags: ['action', 'movement', 'dramatic'],
      }
    ),
  },
};


// Transition type
export const Transition: Story = {
  args: {
    segment: createMockSegment(
      'Hours passed as they ventured deeper into the forest...',
      'transition',
      {
        mood: 'neutral',
        tags: ['time-skip', 'travel'],
      }
    ),
  },
};






// Loading state
export const Loading: Story = {
  args: {
    segment: null,
    isLoading: true,
  },
};

// Error state
export const Error: Story = {
  args: {
    segment: null,
    error: 'Failed to generate narrative. Please try again.',
  },
};

// Long content
export const LongContent: Story = {
  args: {
    segment: createMockSegment(
      `The sprawling city of Aetheria stretched before them, a breathtaking vista of soaring spires and gleaming crystal domes. Bridges of light connected the floating districts, each one pulsing with the energy of thousands of lives.

In the market district, merchants hawked their wares with enthusiastic cries, their stalls overflowing with exotic goods from across the realm. The air was thick with the scent of spices and the sound of countless conversations in a dozen different tongues.

Above it all, the great Citadel of Stars rose into the clouds, its ancient walls bearing witness to centuries of history. The setting sun painted its white marble in shades of gold and rose, creating a spectacle that drew gasps from even the most jaded travelers.`,
      'scene',
      {
        location: 'City of Aetheria',
        mood: 'emotional', // Changed from 'awe' to use a valid mood
        tags: ['city', 'description', 'worldbuilding', 'awe'],
      }
    ),
  },
};