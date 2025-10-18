import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
import { useNPCStore } from '@/state/npcStore';

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
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
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

// NPC Dialogue Stories

// Component wrapper for dialogue stories
const DialogueWithGandalf = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    const store = useNPCStore.getState();
    const npcId = store.createNPC({
      name: 'Gandalf',
      description: 'A wise wizard',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=68',
    });

    setSegment(createMockSegment(
      'You shall not pass! This foe is beyond any of you. Run!',
      'dialogue',
      {
        tags: ['dialogue', 'dramatic'],
        speakerId: npcId,
      }
    ));
  }, []);

  return <NarrativeDisplay segment={segment} />;
};

// Dialogue with speaker and avatar
export const DialogueWithSpeakerAndAvatar: Story = {
  render: () => <DialogueWithGandalf />,
  args: {},
};

// Component wrapper for Frodo dialogue
const DialogueWithFrodo = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    const store = useNPCStore.getState();
    const npcId = store.createNPC({
      name: 'Frodo',
      description: 'A brave hobbit',
      worldId: 'test-world',
    });

    setSegment(createMockSegment(
      'I wish it need not have happened in my time. So do all who live to see such times.',
      'dialogue',
      {
        tags: ['dialogue', 'contemplative'],
        speakerId: npcId,
      }
    ));
  }, []);

  return <NarrativeDisplay segment={segment} />;
};

// Dialogue with speaker but no avatar
export const DialogueWithSpeakerNoAvatar: Story = {
  render: () => <DialogueWithFrodo />,
  args: {},
};

// Dialogue without speaker info (anonymous)
export const DialogueWithoutSpeaker: Story = {
  args: {
    segment: createMockSegment(
      'A mysterious voice echoes from the shadows, its source unknown...',
      'dialogue',
      {
        tags: ['dialogue', 'mysterious'],
      }
    ),
  },
};

// Component wrapper for multiple NPCs
const MultipleNPCs = () => {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);

  useEffect(() => {
    const store = useNPCStore.getState();

    const elrondId = store.createNPC({
      name: 'Elrond',
      description: 'Lord of Rivendell',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=33',
    });

    const boromirId = store.createNPC({
      name: 'Boromir',
      description: 'Son of Gondor',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    });

    const frodoId = store.createNPC({
      name: 'Frodo',
      description: 'Ring bearer',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
    });

    setSegments([
      createMockSegment(
        'The Council of Elrond has been called. We must decide what to do with the Ring.',
        'dialogue',
        { tags: ['dialogue'], speakerId: elrondId }
      ),
      createMockSegment(
        'One does not simply walk into Mordor. Its black gates are guarded by more than just Orcs.',
        'dialogue',
        { tags: ['dialogue'], speakerId: boromirId }
      ),
      createMockSegment(
        'I will take it! I will take the Ring to Mordor, though I do not know the way.',
        'dialogue',
        { tags: ['dialogue'], speakerId: frodoId }
      ),
    ]);
  }, []);

  return (
    <div className="space-y-4">
      {segments.map((segment, index) => (
        <NarrativeDisplay key={index} segment={segment} />
      ))}
    </div>
  );
};

// Multiple NPCs in sequence
export const MultipleNPCDialogue: Story = {
  render: () => <MultipleNPCs />,
  args: {},
};
