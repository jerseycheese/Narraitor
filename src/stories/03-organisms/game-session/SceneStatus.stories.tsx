import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { SceneStatus } from '@/components/GameSession/SceneStatus';
import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';
import type { NarrativeSegment } from '@/types/narrative.types';

/**
 * `SceneStatus` is the canon scene-status surface — characters present + current
 * location for the latest narrative segment. One component, themed per DS via CSS
 * (DS1 left rail, DS2 ambient line, DS3 compact bar — pick a theme in the
 * toolbar). It reads participant names from the NPC store, so the stories seed a
 * couple of demo NPCs.
 */

const ISO = '2026-01-01T12:00:00.000Z';
const WORLD_ID = 'sb-demo-world';

const NPCS: Record<string, NPC> = {
  'npc-marlowe-vance': { id: 'npc-marlowe-vance', name: 'Marlowe Vance', description: 'A weary private investigator.', worldId: WORLD_ID, createdAt: ISO, updatedAt: ISO },
  'npc-sergeant-reyes': { id: 'npc-sergeant-reyes', name: 'Sergeant Reyes', description: 'A cautious police sergeant.', worldId: WORLD_ID, createdAt: ISO, updatedAt: ISO },
};

function makeSegment(overrides: Partial<NarrativeSegment['metadata']>): NarrativeSegment {
  return {
    id: 'sb-scene-seg',
    worldId: WORLD_ID,
    sessionId: 'sb-demo-session',
    type: 'scene',
    content: '',
    metadata: { tags: [], ...overrides },
    timestamp: new Date(ISO),
    createdAt: ISO,
    updatedAt: ISO,
  };
}

/** Seeds demo NPCs so participant names resolve, then renders the scene status. */
function SceneStatusHarness({ segment }: { segment: NarrativeSegment }) {
  useEffect(() => {
    const npcs = useNPCStore.getState().npcs;
    const missing = Object.entries(NPCS).filter(([id]) => !npcs[id]);
    if (missing.length > 0) {
      useNPCStore.setState({ npcs: { ...npcs, ...Object.fromEntries(missing) } });
    }
  }, []);

  return (
    <aside className="manuscript-characters-rail" aria-label="Scene status" style={{ maxWidth: 320 }}>
      <SceneStatus segment={segment} />
    </aside>
  );
}

const meta: Meta<typeof SceneStatus> = {
  title: '03-Organisms/Game Session/SceneStatus',
  component: SceneStatus,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SceneStatus>;

export const Default: Story = {
  render: () => (
    <SceneStatusHarness
      segment={makeSegment({
        location: 'The Alibi Room',
        characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'],
      })}
    />
  ),
};

export const LocationOnly: Story = {
  render: () => <SceneStatusHarness segment={makeSegment({ location: 'The Alibi Room' })} />,
};

export const ParticipantsOnly: Story = {
  render: () => (
    <SceneStatusHarness
      segment={makeSegment({ characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'] })}
    />
  ),
};
