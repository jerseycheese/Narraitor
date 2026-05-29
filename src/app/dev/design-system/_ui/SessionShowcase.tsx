'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ManuscriptSessionShell } from '@/components/GameSession/ManuscriptSessionShell';
import { ManuscriptFloatingHud } from '@/components/GameSession/ManuscriptFloatingHud';
import { ManuscriptActionRail } from '@/components/GameSession/ManuscriptActionRail';
import { SceneStatus } from '@/components/GameSession/SceneStatus';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import type { DSTheme } from './DSToggle';
// Showcase layout classes (dso-group/dso-row) live in the shared component
// showcase stylesheet. The session surface itself is styled in production
// (manuscript-session.css), not here.
import './component-showcase.css';

/**
 * Canonical session showcase. Renders the one real session surface the app
 * ships — `ManuscriptSessionShell` with the real HUD, scene-status rail,
 * narrative history, and choice selector — so the design-system pages govern
 * the same session the app consumes (issue #1276). One canon component, themed
 * per DS1/DS2/DS3 through the `[data-theme]` cascade — not three hand-built
 * look-alikes.
 *
 * The surface carries its styling in production (`src/styles/manuscript-session.css`),
 * so the app's own session and this showcase render the same thing — no
 * showcase-local skinning. Behavior is the real component's; only the content is
 * demo data (no AI — the showcase never mounts the narrative/choice generators).
 * The shell is a fixed full-screen overlay, so it launches on click, the same
 * way the overlay showcase launches the real modal.
 */

// Fixed timestamps keep the demo deterministic for visual regression.
const DEMO_ISO = '2026-01-01T12:00:00.000Z';
const DEMO_DATE = new Date(DEMO_ISO);
const DEMO_WORLD_ID = 'ds-demo-world';

const DEMO_NPCS: Record<string, NPC> = {
  'npc-marlowe-vance': {
    id: 'npc-marlowe-vance',
    name: 'Marlowe Vance',
    description: 'A weary private investigator working the Clara Duvall case.',
    worldId: DEMO_WORLD_ID,
    createdAt: DEMO_ISO,
    updatedAt: DEMO_ISO,
  },
  'npc-sergeant-reyes': {
    id: 'npc-sergeant-reyes',
    name: 'Sergeant Reyes',
    description: 'A cautious police sergeant who would rather you dropped the case.',
    worldId: DEMO_WORLD_ID,
    createdAt: DEMO_ISO,
    updatedAt: DEMO_ISO,
  },
};

const DEMO_SEGMENTS: NarrativeSegment[] = [
  {
    id: 'ds-demo-seg-1',
    worldId: DEMO_WORLD_ID,
    sessionId: 'ds-demo-session',
    type: 'scene',
    content:
      'Rain hammered the sidewalk outside the Alibi Room. Through the smudged window, neon signs bled pink and blue across the wet asphalt. The club was closing, and the bartender was already stacking chairs.',
    characterIds: ['npc-marlowe-vance'],
    metadata: {
      tags: [],
      location: 'The Alibi Room',
      mood: 'mysterious',
      characterIds: ['npc-marlowe-vance'],
    },
    timestamp: DEMO_DATE,
    createdAt: DEMO_ISO,
    updatedAt: DEMO_ISO,
  },
  {
    id: 'ds-demo-seg-2',
    worldId: DEMO_WORLD_ID,
    sessionId: 'ds-demo-session',
    type: 'action',
    content:
      'The bartender\'s composure cracked. He slid a matchbook across the counter. "She got in a car. Black sedan. That\'s all I know" — an address scrawled on the back in smudged ink.',
    characterIds: ['npc-marlowe-vance'],
    metadata: {
      tags: [],
      location: 'The Alibi Room',
      mood: 'tense',
      characterIds: ['npc-marlowe-vance'],
      causedByDecisionId: 'ds-demo-decision-prev',
      causedByDecisionText:
        'You pressed the bartender for information instead of searching the back office.',
      decisionOutcome: 'critical-success',
    },
    timestamp: DEMO_DATE,
    createdAt: DEMO_ISO,
    updatedAt: DEMO_ISO,
  },
  {
    id: 'ds-demo-seg-3',
    worldId: DEMO_WORLD_ID,
    sessionId: 'ds-demo-session',
    type: 'dialogue',
    content:
      '"You\'re poking around where you shouldn\'t," Sergeant Reyes said, leaning against the bar. "But I can\'t stop a man from asking questions. The address on that matchbook — that\'s Deluca\'s warehouse. Be careful."',
    characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'],
    metadata: {
      tags: [],
      location: 'The Alibi Room',
      mood: 'tense',
      speakerId: 'npc-sergeant-reyes',
      characterIds: ['npc-marlowe-vance', 'npc-sergeant-reyes'],
    },
    timestamp: DEMO_DATE,
    createdAt: DEMO_ISO,
    updatedAt: DEMO_ISO,
  },
];

const DEMO_DECISION: Decision = {
  id: 'ds-demo-decision',
  prompt: 'What do you do?',
  decisionWeight: 'major',
  options: [
    {
      id: 'ds-demo-opt-1',
      text: 'Search the warehouse at the matchbook address',
      hint: 'Follows the new lead',
      alignment: 'neutral',
    },
    {
      id: 'ds-demo-opt-2',
      text: 'Tail the black sedan through the warehouse district',
      hint: 'Uses Shadowing',
      alignment: 'lawful',
    },
    {
      id: 'ds-demo-opt-3',
      text: 'Confront Deluca directly at his club',
      hint: 'Uses Interrogation',
      alignment: 'chaotic',
    },
  ],
};

/** Demo character snapshot, using the real canon snapshot classes (no store seeding). */
function DemoCharacterSnapshot() {
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
        <div className="manuscript-character-snapshot-section" data-section="skills">
          <h5 className="manuscript-character-snapshot-subheading">Skills</h5>
          <div className="manuscript-character-snapshot-list">
            {[['Interrogation', '4'], ['Shadowing', '2']].map(([label, value]) => (
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

interface SessionShowcaseProps {
  theme: DSTheme;
  /** Mount the shell immediately (used by the standalone /session routes). */
  defaultOpen?: boolean;
  /** Render the launcher card. Off for the standalone fullscreen routes. */
  showLauncher?: boolean;
}

export function SessionShowcase({
  theme,
  defaultOpen = false,
  showLauncher = true,
}: SessionShowcaseProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const characterButtonRef = useRef<HTMLButtonElement>(null);

  // Seed demo NPCs so the real SceneStatus resolves participant names (the
  // canon path: SceneStatus reads npcStore). Idempotent, demo-only ids.
  useEffect(() => {
    const npcs = useNPCStore.getState().npcs;
    const missing = Object.entries(DEMO_NPCS).filter(([id]) => !npcs[id]);
    if (missing.length > 0) {
      useNPCStore.setState({ npcs: { ...npcs, ...Object.fromEntries(missing) } });
    }
  }, []);

  const close = () => {
    setOpen(false);
    setIsCharacterOpen(false);
  };

  const latestSegment = DEMO_SEGMENTS[DEMO_SEGMENTS.length - 1];

  return (
    <div className="ds-session" data-theme={theme} data-testid="ds-session">
      {showLauncher && (
        <section className="dso-group" aria-label="Game session composition">
          <h3 className="dso-group-title">Game Session</h3>
          <p className="dso-group-note">
            The real <code>ManuscriptSessionShell</code> — the immersive play
            surface, with the real floating HUD, scene-status rail, narrative
            history, and choice selector. One canon component themed by this
            page&apos;s <code>data-theme</code>; the app renders the same thing.
          </p>
          <div className="dso-row">
            <Button onClick={() => setOpen(true)}>Enter the session</Button>
          </div>
        </section>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Solid themed ground behind the shell. In the app the session
              overlays the opaque play page; the guide has only this section
              behind it, so without this the DS3 frosted (92%) shell would
              reveal the page. Portaled to <body> with the shell so both escape
              the design-system sections' stacking contexts (.ds3-section sets
              z-index), which would otherwise paint a later section over the
              fixed overlay. The shell themes from the global [data-theme] the
              page forces, exactly as it does in the app. */}
          <div className="ds-session-backdrop" aria-hidden="true" />
          <ManuscriptSessionShell
          hud={
            <ManuscriptFloatingHud
              characterButtonRef={characterButtonRef}
              characterName="Marlowe Vance"
              onToggleCharacterSummary={() => setIsCharacterOpen((prev) => !prev)}
              isCharacterSummaryExpanded={isCharacterOpen}
              onToggleToolsMenu={() => {}}
              isToolsMenuOpen={false}
              characterSummaryPanel={<DemoCharacterSnapshot />}
              onStartNew={close}
              onBack={close}
              onEndStory={close}
              rightContent={
                <div className="manuscript-hud-right-controls">
                  <button
                    type="button"
                    onClick={close}
                    title="Close"
                    className="manuscript-hud-text-button"
                  >
                    Close
                  </button>
                </div>
              }
            />
          }
          marginContent={<SceneStatus segment={latestSegment} />}
          actionRail={
            <ManuscriptActionRail>
              <div className="manuscript-action-rail-stack">
                <ChoiceSelector
                  decision={DEMO_DECISION}
                  onSelect={() => {}}
                  enableCustomInput
                  onCustomSubmit={() => {}}
                />
              </div>
            </ManuscriptActionRail>
          }
        >
          <NarrativeHistory segments={DEMO_SEGMENTS} disableInitialAutoScroll />
          </ManuscriptSessionShell>
        </>,
        document.body,
      )}
    </div>
  );
}
