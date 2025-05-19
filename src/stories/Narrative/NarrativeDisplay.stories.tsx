import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';

const meta = {
  title: 'Narraitor/Narrative/NarrativeDisplay',
  component: NarrativeDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
  },
} satisfies Meta<typeof NarrativeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const createSegment = (
  type: NarrativeSegment['type'],
  content: string,
  metadata?: Partial<NarrativeSegment['metadata']>
): NarrativeSegment => ({
  id: 'seg-1',
  content,
  type,
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

export const Scene: Story = {
  args: {
    segment: createSegment(
      'scene',
      'The ancient forest whispered secrets in the moonlight. Towering trees cast long shadows across the mossy ground, their branches swaying gently in the evening breeze. A sense of mystery hung thick in the air, as if the very forest itself held untold stories waiting to be discovered.',
      {
        location: 'Mystical Forest',
        mood: 'mysterious',
        tags: ['forest', 'night', 'mystery'],
      }
    ),
  },
};

export const Dialogue: Story = {
  args: {
    segment: createSegment(
      'dialogue',
      '"Welcome to the Mystical Forest," said the ethereal voice. "Few mortals find their way here without purpose. What brings you to these ancient woods?"',
      {
        characterIds: ['char-1'],
        mood: 'mysterious',
        tags: ['conversation', 'introduction'],
      }
    ),
  },
};

export const Action: Story = {
  args: {
    segment: createSegment(
      'action',
      'The hero leapt across the chasm with a mighty roar, the wind whipping through their hair as they soared through the air. Time seemed to slow as they reached for the opposite ledge, fingers stretching desperately towards safety.',
      {
        mood: 'action',
        tags: ['action', 'movement', 'dramatic'],
      }
    ),
  },
};

export const Transition: Story = {
  args: {
    segment: createSegment(
      'transition',
      'Hours passed as they ventured deeper into the forest, the canopy above growing thicker with each step.',
      {
        mood: 'neutral',
        tags: ['transition', 'time-passage'],
      }
    ),
  },
};

export const Loading: Story = {
  args: {
    segment: null,
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    segment: null,
    error: 'Failed to generate narrative content. Please try again.',
  },
};

export const LongContent: Story = {
  args: {
    segment: createSegment(
      'scene',
      `The sprawling city of Aetheria stretched before them, a breathtaking vista of soaring spires and gleaming crystal domes. Bridges of light connected the floating districts, each one pulsing with the energy of thousands of lives.

In the market district, merchants hawked their wares with enthusiastic cries, their stalls overflowing with exotic goods from across the realm. The air was thick with the scent of spices and the sound of countless conversations in a dozen different tongues.

Above it all, the great Citadel of Stars rose into the clouds, its ancient walls bearing witness to centuries of history. The setting sun painted its white marble in shades of gold and rose, creating a spectacle that drew gasps from even the most jaded travelers.`,
      {
        location: 'City of Aetheria',
        mood: 'relaxed',
        tags: ['city', 'description', 'worldbuilding'],
      }
    ),
  },
};