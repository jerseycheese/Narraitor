import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { RelevanceDebuggerSection } from './RelevanceDebuggerSection';
import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';

const meta: Meta<typeof RelevanceDebuggerSection> = {
  title: 'DevTools/RelevanceDebuggerSection',
  component: RelevanceDebuggerSection,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RelevanceDebuggerSection>;

const SAMPLE_SEGMENTS: NarrativeSegment[] = [
  {
    id: 'segment-1',
    sessionId: 'session-debug',
    worldId: 'world-alpha',
    content: 'You arrive at the Ancient Ruins as dusk settles over the valley.',
    type: 'scene',
    characterIds: ['npc-guide'],
    decisions: [],
    metadata: {
      tags: ['ancient', 'mystery'],
      location: 'Ancient Ruins',
      characterIds: ['npc-guide'],
    },
    timestamp: new Date('2025-10-20T10:00:00.000Z'),
    createdAt: '2025-10-20T10:00:00.000Z',
    updatedAt: '2025-10-20T10:00:00.000Z',
  },
  {
    id: 'segment-2',
    sessionId: 'session-debug',
    worldId: 'world-alpha',
    content: 'A guardian spirit emerges, questioning your intentions.',
    type: 'dialogue',
    characterIds: ['npc-guide', 'guardian-spirit'],
    decisions: [],
    metadata: {
      tags: ['spirit', 'negotiation'],
      location: 'Ancient Ruins',
      characterIds: ['npc-guide', 'guardian-spirit'],
    },
    timestamp: new Date('2025-10-21T14:00:00.000Z'),
    createdAt: '2025-10-21T14:00:00.000Z',
    updatedAt: '2025-10-21T14:00:00.000Z',
  },
];

const StoryContainer = () => {
  useEffect(() => {
    playerDecisionTracker.clearDecisions();
    playerDecisionTracker.recordDecision(
      'How do you greet the guardian spirit?',
      'Offer a respectful bow',
      'diplomatic',
      'session-debug',
      'world-alpha',
      {
        location: 'Ancient Ruins',
        situation: 'Negotiate safe passage with the guardian spirit.',
        charactersPresent: ['guardian-spirit', 'npc-guide'],
      }
    );
    playerDecisionTracker.recordDecision(
      'Do you explore the hidden chamber?',
      'Investigate the glyphs',
      'neutral',
      'session-debug',
      'world-alpha',
      {
        location: 'Ancient Ruins',
        situation: 'Decide whether to explore a newly revealed chamber.',
        charactersPresent: ['npc-guide'],
      }
    );

    useSessionStore.setState((state) => ({
      ...state,
      id: 'session-debug',
      status: 'active',
      worldId: 'world-alpha',
      characterId: 'hero-1',
    }));

    useWorldStore.setState((state) => ({
      ...state,
      worlds: {
        ...state.worlds,
        'world-alpha': {
          id: 'world-alpha',
          name: 'World Alpha',
          description: 'A mysterious realm filled with ancient secrets.',
          genre: 'mystery',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            attributePointPool: 10,
            skillPointPool: 10,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    }));

    useNarrativeStore.setState((state) => ({
      ...state,
      segments: SAMPLE_SEGMENTS.reduce<Record<string, NarrativeSegment>>((acc, segment) => {
        acc[segment.id] = segment;
        return acc;
      }, {}),
      sessionSegments: {
        ...state.sessionSegments,
        'session-debug': SAMPLE_SEGMENTS.map((segment) => segment.id),
      },
    }));
  }, []);

  return (
    <div className="p-4 bg-gray-200 min-h-screen">
      <RelevanceDebuggerSection />
    </div>
  );
};

export const Default: Story = {
  render: () => <StoryContainer />,
};
