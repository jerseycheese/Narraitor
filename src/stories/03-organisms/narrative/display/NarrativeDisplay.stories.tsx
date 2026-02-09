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

const ensureStorybookNPC = (id: string, name: string) => {
  const npcStore = useNPCStore.getState();
  const existing = npcStore.getById(id);
  const description =
    existing?.description || `${name}(storybook preview character)`;

  if (!existing) {
    npcStore.createNPC({
      id,
      name,
      description,
      worldId: 'storybook-world',
    });
    return;
  }

  npcStore.updateNPC(id, {
    name,
    description,
    worldId: existing.worldId || 'storybook-world',
  });
};

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
  worldId: 'storybook-world',
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
const SceneWithDialogueStory: React.FC = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    ensureStorybookNPC('guardian-lysara', 'Guardian Lysara');
    ensureStorybookNPC('captain-ryn-solis', 'Captain Ryn Solis');

    setSegment(
      createMockSegment(
        'Guardian Lysara stepped forward from the shadows. Guardian Lysara said, Welcome to the Mystical Forest. Captain Ryn Solis replied, Thank you for your guidance.',
        'scene',
        {
          characterIds: ['guardian-lysara', 'captain-ryn-solis'],
          mood: 'mysterious',
          tags: ['conversation', 'introduction'],
          location: 'Forest Entrance',
          characters: [
            {
              id: 'guardian-lysara',
              name: 'Guardian Lysara',
            },
            {
              id: 'captain-ryn-solis',
              name: 'Captain Ryn Solis',
            },
          ],
        }
      )
    );
  }, []);

  if (!segment) {
    return null;
  }

  return <NarrativeDisplay segment={segment} />;
};

export const SceneWithDialogue: Story = {
  args: {
    segment: null,
  },
  render: () => <SceneWithDialogueStory />,
};




// Dialogue type - shows blue border and conversation styling
export const Dialogue: Story = {
  args: {
    segment: createMockSegment(
      '"Welcome, traveler," the innkeeper says with a warm smile. "What brings you to our village on this cold night?"',
      'dialogue',
      {
        location: 'Village Inn',
        mood: 'neutral',
        tags: ['dialogue', 'conversation', 'npc'],
      }
    ),
  },
};

// Action type - shows amber border and action-focused styling
export const Action: Story = {
  args: {
    segment: createMockSegment(
      'You swing your sword in a wide arc, striking the bandit. He dodges backward, barely avoiding the blade, then charges forward with his dagger raised.',
      'action',
      {
        location: 'Dark Alley',
        mood: 'action',
        tags: ['combat', 'action', 'fight'],
      }
    ),
  },
};

// Transition type - shows preserved line breaks formatting
export const Transition: Story = {
  args: {
    segment: createMockSegment(
      `Hours passed as they ventured deeper into the forest... The *ancient* path wound through towering trees. Time seemed to slow in this *mystical* place.`,
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
const RealisticMixedStory: React.FC = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    ensureStorybookNPC('guardian-lysara', 'Guardian Lysara');
    ensureStorybookNPC('captain-ryn-solis', 'Captain Ryn Solis');

    setSegment(
      createMockSegment(
        `The ancient chamber fell silent as they entered. Dust motes danced in the *ethereal* light filtering through crystal windows. Guardian Lysara emerged from the shadows, their cloak whispering against the stone floor. "Welcome, travelers," Guardian Lysara said. "You have come seeking the *ancient* knowledge guarded within these walls." Captain Ryn Solis replied, "We need to understand the curse that plagues our land." She whispered, "The secret lies in the old texts." But Guardian Lysara asked, "How do we know which ones to trust?" Their quest would require both courage and wisdom to succeed.`,
        'scene',
        {
          location: 'Ancient Chamber',
          characterIds: ['guardian-lysara', 'captain-ryn-solis'],
          mood: 'mysterious',
          tags: ['dialogue', 'exploration', 'mystery'],
          characters: [
            {
              id: 'guardian-lysara',
              name: 'Guardian Lysara',
            },
            {
              id: 'captain-ryn-solis',
              name: 'Captain Ryn Solis',
            },
          ],
        }
      )
    );
  }, []);

  if (!segment) {
    return null;
  }

  return <NarrativeDisplay segment={segment} />;
};

export const RealisticMixedContent: Story = {
  args: {
    segment: null,
  },
  render: () => <RealisticMixedStory />,
};

// NPC Dialogue Stories

// Component wrapper for dialogue stories
const DialogueWithGandalf = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    const store = useNPCStore.getState();
    const npcId = store.createNPC({
      id: 'storybook-gandalf',
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
  args: {
    segment: null,
  },
};

// Component wrapper for Frodo dialogue
const DialogueWithFrodo = () => {
  const [segment, setSegment] = React.useState<NarrativeSegment | null>(null);

  useEffect(() => {
    const store = useNPCStore.getState();
    const npcId = store.createNPC({
      id: 'storybook-frodo-dialogue',
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
  args: {
    segment: null,
  },
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
      id: 'storybook-elrond',
      name: 'Elrond',
      description: 'Lord of Rivendell',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=33',
    });

    const boromirId = store.createNPC({
      id: 'storybook-boromir',
      name: 'Boromir',
      description: 'Son of Gondor',
      worldId: 'test-world',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    });

    const frodoId = store.createNPC({
      id: 'storybook-frodo-ring',
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
    <div>
      {segments.map((segment, index) => (
        <NarrativeDisplay key={index} segment={segment} />
      ))}
    </div>
  );
};

// Multiple NPCs in sequence
export const MultipleNPCDialogue: Story = {
  render: () => <MultipleNPCs />,
  args: {
    segment: null,
  },
};

// Mixed segment types showing visual variety
const MixedSegmentSequence = () => {
  const segments: NarrativeSegment[] = [
    createMockSegment(
      'You enter the bustling tavern. Firelight dances across worn wooden tables, and the air is thick with the smell of ale and roasted meat.',
      'scene',
      {
        location: 'The Prancing Pony',
        mood: 'neutral',
        tags: ['tavern', 'arrival'],
      }
    ),
    createMockSegment(
      '"You look like you\'ve traveled far," the barkeep says, eyeing your dusty cloak. "What can I get you?"',
      'dialogue',
      {
        location: 'The Prancing Pony',
        mood: 'neutral',
        tags: ['dialogue', 'conversation'],
      }
    ),
    createMockSegment(
      'You reach for your coinpurse, but a hand grabs your wrist. You spin around, striking at the attacker.',
      'action',
      {
        location: 'The Prancing Pony',
        mood: 'action',
        tags: ['combat', 'ambush'],
      }
    ),
    createMockSegment(
      'Hours later, you leave the tavern and travel through the night toward the northern pass.',
      'transition',
      {
        mood: 'neutral',
        tags: ['travel', 'time-passage'],
      }
    ),
  ];

  return (
    <div>
      {segments.map((segment, index) => (
        <NarrativeDisplay key={index} segment={segment} />
      ))}
    </div>
  );
};

// Shows different segment types in sequence with varied visual styling
export const MixedSegmentTypes: Story = {
  render: () => <MixedSegmentSequence />,
  args: {
    segment: null,
  },
};
