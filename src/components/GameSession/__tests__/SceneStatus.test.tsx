import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneStatus } from '../SceneStatus';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';
import type { NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/state/npcStore');

const npcs: Record<string, { name: string; avatarUrl?: string }> = {
  'npc-guard': { name: 'Sergeant Reyes' },
};

beforeEach(() => {
  (useNPCStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ getById: (id: string) => npcs[id] })
  );
});

const makeSegment = (overrides: Partial<NarrativeSegment>): NarrativeSegment =>
  ({
    id: 'seg-1',
    content: 'A scene.',
    type: 'scene',
    timestamp: new Date(),
    metadata: { tags: [] },
    ...overrides,
  } as NarrativeSegment);

describe('SceneStatus', () => {
  it('renders participants from the latest segment', () => {
    render(<SceneStatus segment={makeSegment({ characterIds: ['npc-guard'] })} />);

    expect(screen.getByText('Characters Present')).toBeInTheDocument();
    expect(screen.getByText('Sergeant Reyes')).toBeInTheDocument();
  });

  it('renders the current location from segment metadata', () => {
    render(
      <SceneStatus
        segment={makeSegment({ metadata: { tags: [], location: 'The Alibi Room' } })}
      />
    );

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('The Alibi Room')).toBeInTheDocument();
  });

  it('returns null when there are no participants and no location', () => {
    const { container } = render(<SceneStatus segment={makeSegment({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when there is no segment', () => {
    const { container } = render(<SceneStatus segment={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SceneStatus dispositions', () => {
  const mockWorldStates = (worldStates: Record<string, unknown>) => {
    (useWorldStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ worldStates })
    );
  };

  beforeEach(() => {
    mockWorldStates({});
  });

  it('shows no disposition when no relationship state exists', () => {
    const { container } = render(
      <SceneStatus segment={makeSegment({ worldId: 'world-1', characterIds: ['npc-guard'] })} />
    );

    expect(container.querySelector('.scene-status-disposition')).toBeNull();
  });

  it('shows a trust-derived disposition label when relationship state exists', () => {
    mockWorldStates({
      'world-1': {
        npcRelationships: {
          'npc-guard': {
            trust: 22,
            sentiment: -40,
            lastInteraction: '2026-01-01T00:00:00.000Z',
            sessionId: 'session-1',
          },
        },
      },
    });

    render(
      <SceneStatus segment={makeSegment({ worldId: 'world-1', characterIds: ['npc-guard'] })} />
    );

    const disposition = screen.getByText('Hostile');
    expect(disposition).toHaveAttribute('data-disposition', 'hostile');
  });
});
