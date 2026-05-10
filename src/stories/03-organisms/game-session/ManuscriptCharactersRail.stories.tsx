import type { Meta, StoryObj } from '@storybook/react';
import { ManuscriptCharactersRail } from '@/components/GameSession/ManuscriptCharactersRail';
import { useNPCStore } from '@/state/npcStore';
import type { NarrativeSegment } from '@/types/narrative.types';
import React, { useEffect } from 'react';

const MOCK_NPCS = {
  'npc-elara': {
    id: 'npc-elara',
    name: 'Elara the Wise',
    description: 'An elderly sage',
    worldId: 'world-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  'npc-thorne': {
    id: 'npc-thorne',
    name: 'Thorne',
    description: 'A grizzled ranger',
    worldId: 'world-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  'npc-vex': {
    id: 'npc-vex',
    name: 'Captain Vex',
    description: 'A cunning pirate captain',
    worldId: 'world-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
};

const MOCK_SEGMENT: NarrativeSegment = {
  id: 'segment-1',
  content: 'The group gathered around the campfire.',
  type: 'scene',
  characterIds: ['npc-elara', 'npc-thorne', 'npc-vex'],
  metadata: { tags: [] },
  timestamp: new Date('2025-01-01T00:00:00Z'),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// Decorator that pre-populates the NPC store with mock data
const WithMockNPCs = (Story: React.FC) => {
  useEffect(() => {
    useNPCStore.setState({ npcs: MOCK_NPCS, entities: MOCK_NPCS });
    return () => { useNPCStore.setState({ npcs: {}, entities: {} }); };
  }, []);
  return <Story />;
};

const meta: Meta<typeof ManuscriptCharactersRail> = {
  title: '03-Organisms/Game Session/ManuscriptCharactersRail',
  component: ManuscriptCharactersRail,
  parameters: {
    layout: 'padded',
  },
  decorators: [WithMockNPCs],
};

export default meta;
type Story = StoryObj<typeof ManuscriptCharactersRail>;

export const RailVariant: Story = {
  args: {
    segment: MOCK_SEGMENT,
    variant: 'rail',
  },
};

export const MobileBarVariant: Story = {
  args: {
    segment: MOCK_SEGMENT,
    variant: 'mobile-bar',
  },
};

export const Empty: Story = {
  args: {
    segment: null,
    variant: 'rail',
  },
};
