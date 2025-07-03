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

// Dialogue type - showcases automatic quotation mark formatting
export const Dialogue: Story = {
  args: {
    segment: createMockSegment(
      'The guardian said, Welcome to the Mystical Forest. The traveler replied, Thank you for your guidance.',
      'dialogue',
      {
        characterIds: ['char-1'],
        mood: 'mysterious',
        tags: ['conversation', 'introduction'],
      }
    ),
  },
};

// Dialogue with existing quotes - shows preservation of existing formatting
export const DialogueWithQuotes: Story = {
  args: {
    segment: createMockSegment(
      'She whispered, "The secret lies beneath the ancient oak." He asked, "How do you know this?"',
      'dialogue',
      {
        characterIds: ['char-1', 'char-2'],
        mood: 'mysterious',
        tags: ['conversation', 'secrets'],
      }
    ),
  },
};

// Action type - shows action segment formatting (no dialogue formatting)
export const Action: Story = {
  args: {
    segment: createMockSegment(
      'The hero leapt across the chasm with a *mighty* roar. The warrior said, For honor! But the words were lost in the wind.',
      'action',
      {
        mood: 'action',
        tags: ['action', 'movement', 'dramatic'],
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

// Paragraph formatting - shows multi-paragraph organization
export const ParagraphFormatting: Story = {
  args: {
    segment: createMockSegment(
      `The ancient library stretched endlessly before them. Towering shelves disappeared into shadow above.

Books of every size and color filled the shelves. Some glowed with inner light, others seemed to absorb the surrounding darkness.

The *mystical* atmosphere was overwhelming. This was truly a place of *ancient wisdom*.`,
      'scene',
      {
        location: 'Ancient Library',
        mood: 'mysterious',
        tags: ['library', 'knowledge', 'atmosphere'],
      }
    ),
  },
};

// Text emphasis - showcases italic formatting
export const TextEmphasis: Story = {
  args: {
    segment: createMockSegment(
      'The *ancient* artifact glowed with *mysterious* power. Its surface was covered in *intricate* runes that seemed to pulse with life.',
      'scene',
      {
        mood: 'mysterious',
        tags: ['artifact', 'magic', 'discovery'],
      }
    ),
  },
};

// Mixed content formatting - combines dialogue, paragraphs, and emphasis
export const MixedContentFormatting: Story = {
  args: {
    segment: createMockSegment(
      `The tavern was *bustling* with activity. Smoke from countless pipes created a hazy atmosphere.

The bartender said, What can I get you? The traveler replied, Just some information about the *ancient ruins*.

The conversation continued late into the night. Many *secrets* were shared over ale and bread.`,
      'scene',
      {
        location: 'The Crossroads Tavern',
        mood: 'neutral',
        tags: ['tavern', 'conversation', 'information'],
      }
    ),
  },
};

// Segment comparison - shows how same content formats differently by type
export const SceneFormatting: Story = {
  args: {
    segment: createMockSegment(
      `The wizard said, Beware the *ancient* curse!

The hero replied, I am not afraid.

They ventured forth into the *dark* cavern.`,
      'scene', // Formats dialogue with quotes and double paragraph spacing
      {
        location: 'Mysterious Cavern',
        mood: 'mysterious',
        tags: ['dialogue', 'adventure'],
      }
    ),
  },
};

export const ActionFormatting: Story = {
  args: {
    segment: createMockSegment(
      `The wizard said, Beware the *ancient* curse!

The hero replied, I am not afraid.

They ventured forth into the *dark* cavern.`,
      'action', // Does NOT format dialogue, only emphasis
      {
        mood: 'action',
        tags: ['dialogue', 'adventure'],
      }
    ),
  },
};

export const DialogueFormatting: Story = {
  args: {
    segment: createMockSegment(
      `The wizard said, Beware the *ancient* curse!

The hero replied, I am not afraid.

They ventured forth into the *dark* cavern.`,
      'dialogue', // Formats dialogue with quotes and adds italic styling
      {
        characterIds: ['wizard', 'hero'],
        mood: 'mysterious',
        tags: ['conversation', 'warning'],
      }
    ),
  },
};

// Long content with comprehensive formatting
export const LongContentFormatted: Story = {
  args: {
    segment: createMockSegment(
      `The sprawling city of Aetheria stretched before them, a breathtaking vista of soaring spires and gleaming crystal domes. Bridges of *light* connected the floating districts, each one pulsing with the energy of thousands of lives.

In the market district, merchants hawked their wares with enthusiastic cries. The merchant called out, Fresh fruits from the *celestial* gardens! A customer replied, How much for a dozen starfruit?

Above it all, the great Citadel of Stars rose into the clouds. Its *ancient* walls bore witness to centuries of history. The setting sun painted its white marble in shades of gold and rose, creating a spectacle that drew gasps from even the most jaded travelers.`,
      'scene',
      {
        location: 'City of Aetheria',
        mood: 'emotional',
        tags: ['city', 'description', 'worldbuilding', 'dialogue'],
      }
    ),
  },
};
