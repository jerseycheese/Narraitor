import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';

const meta = {
  title: 'Narraitor/Narrative/Display/NarrativeHistory',
  component: NarrativeHistory,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    segments: {
      description: 'Array of narrative segments to display',
    },
    isLoading: {
      description: 'Whether a new segment is being generated',
      control: 'boolean',
    },
    error: {
      description: 'Error message to display',
      control: 'text',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
} satisfies Meta<typeof NarrativeHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock segments
const createMockSegment = (
  id: string,
  content: string,
  type: NarrativeSegment['type'] = 'scene'
): NarrativeSegment => ({
  id,
  content,
  type,
  sessionId: 'session-1',
  worldId: 'world-1',
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    tags: ['test'],
    mood: 'neutral'
  }
});



// Multiple segments
export const MultipleSegments: Story = {
  args: {
    segments: [
      createMockSegment(
        'seg-1',
        'You find yourself standing at the entrance of a mysterious cave. The air is damp and cool, and you can hear the distant sound of dripping water echoing from within.'
      ),
      createMockSegment(
        'seg-2',
        'As you step into the cave, your eyes slowly adjust to the darkness. You notice ancient symbols carved into the walls, glowing faintly with an otherworldly light.',
        'action' // Changed from 'exploration' to match valid types
      ),
      createMockSegment(
        'seg-3',
        'The tunnel splits into three paths. To the left, you hear running water. The middle path descends steeply into darkness. The right path shows signs of recent foot traffic.',
        'dialogue' // Changed from 'decision' to match valid types
      ),
    ],
    isLoading: false,
  },
};

// Loading state with existing segments
export const LoadingWithHistory: Story = {
  args: {
    segments: [
      createMockSegment(
        'seg-1',
        'You find yourself standing at the entrance of a mysterious cave. The air is damp and cool, and you can hear the distant sound of dripping water echoing from within.'
      ),
      createMockSegment(
        'seg-2',
        'As you step into the cave, your eyes slowly adjust to the darkness. You notice ancient symbols carved into the walls, glowing faintly with an otherworldly light.',
        'action' // Changed from 'exploration' to match valid types
      ),
    ],
    isLoading: true,
  },
};

// Error state with existing segments
export const ErrorWithHistory: Story = {
  args: {
    segments: [
      createMockSegment(
        'seg-1',
        'You find yourself standing at the entrance of a mysterious cave. The air is damp and cool, and you can hear the distant sound of dripping water echoing from within.'
      ),
    ],
    isLoading: false,
    error: 'Failed to generate narrative. Please try again.',
  },
};

// Long conversation
export const LongConversation: Story = {
  args: {
    segments: Array.from({ length: 10 }, (_, i) => 
      createMockSegment(
        `seg-${i + 1}`,
        `This is narrative segment ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
        i % 3 === 0 ? 'scene' : i % 3 === 1 ? 'action' : 'transition' // Changed to use valid types
      )
    ),
    isLoading: false,
  },
};

// Different segment types
export const MixedSegmentTypes: Story = {
  args: {
    segments: [
      createMockSegment('seg-1', 'The adventure begins in the bustling marketplace of Eldoria.', 'scene'),
      createMockSegment('seg-2', 'You notice a hooded figure watching you from the shadows.', 'action'), // Changed from 'exploration'
      createMockSegment('seg-3', 'The figure suddenly attacks! Draw your weapon!', 'action'), // Changed from 'combat'
      createMockSegment('seg-4', 'After defeating your assailant, you find a mysterious note.', 'transition'), // Changed from 'resolution'
      createMockSegment('seg-5', 'The note reveals the location of an ancient artifact.', 'scene'), // Changed from 'revelation'
      createMockSegment('seg-6', 'You met a fellow adventurer who offers to join your quest.', 'dialogue'), // Changed from 'character_interaction'
    ],
    isLoading: false,
  },
};

