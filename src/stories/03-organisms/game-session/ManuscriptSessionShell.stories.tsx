import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { ManuscriptSessionShell } from '@/components/GameSession/ManuscriptSessionShell';
import { ManuscriptDecisionBlock } from '@/components/GameSession/ManuscriptDecisionBlock';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
import { SceneStatus } from '@/components/GameSession/SceneStatus';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';

/**
 * `ManuscriptSessionShell` is the immersive play surface. These stories render
 * it with the REAL region components the app composes — `ManuscriptFloatingHud`,
 * `SceneStatus`, `ManuscriptDecisionBlock` + `ChoiceSelector`, and `NarrativeHistory`
 * — fed deterministic demo data (no AI), the same shape the living style guide's
 * SessionShowcase uses (issue #1276). Pick light or dark from the toolbar to see
 * the shell in each color mode.
 */

const ISO = '2026-01-01T12:00:00.000Z';
const DATE = new Date(ISO);
const WORLD_ID = 'sb-demo-world';

const NPCS: Record<string, NPC> = {
  'npc-marlowe-vance': {
    id: 'npc-marlowe-vance',
    name: 'Marlowe Vance',
    description: 'A weary private investigator.',
    worldId: WORLD_ID,
    createdAt: ISO,
    updatedAt: ISO,
  },
  'npc-sergeant-reyes': {
    id: 'npc-sergeant-reyes',
    name: 'Sergeant Reyes',
    description: 'A cautious police sergeant.',
    worldId: WORLD_ID,
    createdAt: ISO,
    updatedAt: ISO,
  },
};

const SEGMENTS: NarrativeSegment[] = [
  {
    id: 'sb-seg-1',
    worldId: WORLD_ID,
    sessionId: 'sb-demo-session',
    type: 'scene',
    content:
      'Rain hammered the sidewalk outside the Alibi Room. Through the smudged window, neon signs bled pink and blue across the wet asphalt. The club was closing, and the bartender was already stacking chairs.',
    characterIds: ['npc-marlowe-vance'],
    metadata: { tags: [], location: 'The Alibi Room', mood: 'mysterious', characterIds: ['npc-marlowe-vance'] },
    timestamp: DATE,
    createdAt: ISO,
    updatedAt: ISO,
  },
  {
    id: 'sb-seg-2',
    worldId: WORLD_ID,
    sessionId: 'sb-demo-session',
    type: 'action',
    content:
      'The bartender\'s composure cracked. He slid a matchbook across the counter. "She got in a car. Black sedan. That\'s all I know."',
    characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'],
    metadata: {
      tags: [],
      location: 'The Alibi Room',
      mood: 'tense',
      characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'],
      causedByDecisionId: 'sb-decision-prev',
      causedByDecisionText:
        'You pressed the bartender for information instead of searching the back office.',
      decisionOutcome: 'critical-success',
    },
    timestamp: DATE,
    createdAt: ISO,
    updatedAt: ISO,
  },
];

const DECISION: Decision = {
  id: 'sb-decision',
  prompt: 'What do you do?',
  decisionWeight: 'major',
  options: [
    { id: 'sb-opt-1', text: 'Search the warehouse at the matchbook address', hint: 'Follows the new lead', alignment: 'neutral' },
    { id: 'sb-opt-2', text: 'Tail the black sedan through the warehouse district', hint: 'Uses Shadowing', alignment: 'lawful' },
    { id: 'sb-opt-3', text: 'Confront Deluca directly at his club', hint: 'Uses Interrogation', alignment: 'chaotic' },
  ],
};

/** Demo snapshot using the real canon snapshot classes (no store seeding). */
function DemoSnapshot() {
  return (
    <div className="manuscript-character-snapshot">
      <h4 className="manuscript-hud-panel-title">CHARACTER SNAPSHOT</h4>
      <div className="manuscript-character-snapshot-identity">
        <div className="manuscript-character-snapshot-name">Marlowe Vance</div>
      </div>
      <div className="manuscript-character-snapshot-stats">
        <div className="manuscript-character-snapshot-section">
          <div className="manuscript-character-snapshot-list">
            <div className="manuscript-character-snapshot-level-row">
              <span className="manuscript-character-snapshot-item-label">Level</span>
              <span className="manuscript-character-snapshot-item-value">4</span>
            </div>
          </div>
        </div>
        <div className="manuscript-character-snapshot-section">
          <h5 className="manuscript-character-snapshot-subheading">Attributes</h5>
          <div className="manuscript-character-snapshot-list">
            {[['Instinct', '14'], ['Composure', '11'], ['Street Smarts', '16']].map(([label, value]) => (
              <div key={label} className="manuscript-character-snapshot-item">
                <span className="manuscript-character-snapshot-item-label">{label}</span>
                <span className="manuscript-character-snapshot-item-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the shell with the real composed session. `mode` toggles the
 * representative state the action rail / narrative reflect. `withRail`
 * mirrors ActiveGameSession's own `hasSceneStatus` gate — the app omits
 * `marginContent` entirely (not just an empty SceneStatus) whenever the
 * latest segment has no participants or location to report.
 */
function SessionShellHarness({
  mode = 'active',
  withRail = true,
}: {
  mode?: 'active' | 'streaming' | 'loading';
  withRail?: boolean;
}) {
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);

  // Seed demo NPCs so the real SceneStatus resolves participant names.
  useEffect(() => {
    const npcs = useNPCStore.getState().npcs;
    const missing = Object.entries(NPCS).filter(([id]) => !npcs[id]);
    if (missing.length > 0) {
      useNPCStore.setState({ npcs: { ...npcs, ...Object.fromEntries(missing) } });
    }
  }, []);

  const isStreaming = mode === 'streaming';
  const isLoading = mode === 'loading';

  return (
    <ManuscriptSessionShell
      hud={
        <ManuscriptFloatingHud
          characterName="Marlowe Vance"
          onToggleCharacterSummary={() => setIsCharacterOpen((prev) => !prev)}
          isCharacterSummaryExpanded={isCharacterOpen}
          characterSummaryPanel={<DemoSnapshot />}
        />
      }
      marginContent={withRail ? <SceneStatus segment={SEGMENTS[SEGMENTS.length - 1]} /> : null}
    >
      <NarrativeHistory
        segments={isLoading ? [] : SEGMENTS}
        isLoading={isLoading}
        disableInitialAutoScroll
      />

      <ManuscriptDecisionBlock isStreaming={isStreaming}>
        <ChoiceSelector
          decision={DECISION}
          onSelect={() => {}}
          enableCustomInput
          onCustomSubmit={() => {}}
          isDisabled={isStreaming || isLoading}
        />
      </ManuscriptDecisionBlock>
    </ManuscriptSessionShell>
  );
}

const meta: Meta<typeof ManuscriptSessionShell> = {
  title: '03-Organisms/Game Session/ManuscriptSessionShell',
  component: ManuscriptSessionShell,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ManuscriptSessionShell>;

export const Default: Story = {
  render: () => <SessionShellHarness mode="active" />,
};

export const Streaming: Story = {
  render: () => <SessionShellHarness mode="streaming" />,
};

export const LoadingNarrative: Story = {
  render: () => <SessionShellHarness mode="loading" />,
};

export const WithoutRail: Story = {
  render: () => <SessionShellHarness mode="active" withRail={false} />,
};
