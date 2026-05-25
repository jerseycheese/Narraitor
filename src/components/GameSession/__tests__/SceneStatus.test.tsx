import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneStatus } from '../SceneStatus';
import { useNPCStore } from '@/state/npcStore';
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
