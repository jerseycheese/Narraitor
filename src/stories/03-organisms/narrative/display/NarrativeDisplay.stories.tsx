import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { NarrativeSegment } from '@/components/types/narrative.types';

// Updated stories aligned with actual app usage patterns

const meta = {
  title: '03-Organisms/narrative/display/NarrativeDisplay',
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

// Scene with dialogue - shows automatic quotation mark formatting in real scene segments
export const SceneWithDialogue: Story = {
  args: {
    segment: createMockSegment(
      'The guardian stepped forward from the shadows. The guardian said, Welcome to the Mystical Forest. The traveler replied, Thank you for your guidance.',
      'scene',
      {
        characterIds: ['char-1'],
        mood: 'mysterious',
        tags: ['conversation', 'introduction'],
        location: 'Forest Entrance'
      }
    ),
  },
};




// Transition type - shows preserved line breaks formatting
export const Transition: Story = {
  args: {
    segment: createMockSegment(
      `Hours passed as they ventured deeper into the forest...

The *ancient* path wound through towering trees.

Time seemed to slow in this *mystical* place.`,
      'transition',
      {
        mood: 'neutral',
        tags: ['time-skip', 'travel', 'atmosphere'],
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



// Realistic comprehensive example - shows mixed content with all formatting features
export const RealisticMixedContent: Story = {
  args: {
    segment: createMockSegment(
      `The ancient chamber fell silent as they entered. Dust motes danced in the *ethereal* light filtering through crystal windows.

The guardian stepped forward from the shadows. The guardian said, Welcome, travelers. You have come seeking the *ancient* knowledge.

The hero replied, We need to understand the curse that plagues our land. She whispered, "The secret lies in the old texts." But he asked, "How do we know which ones to trust?"

Their quest would require both courage and wisdom to succeed.`,
      'scene',
      {
        location: 'Ancient Chamber',
        characterIds: ['guardian', 'hero'],
        mood: 'mysterious',
        tags: ['dialogue', 'exploration', 'mystery'],
      }
    ),
  },
};

