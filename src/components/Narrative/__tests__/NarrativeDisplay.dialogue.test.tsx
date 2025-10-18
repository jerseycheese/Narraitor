import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';

jest.mock('@/state/npcStore');

const mockUseNPCStore = useNPCStore as jest.MockedFunction<typeof useNPCStore>;

describe('NarrativeDisplay - Dialogue with Speaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays speaker name for dialogue segment with speakerId', () => {
    const mockGetById = jest.fn((id: string) =>
      id === 'npc-1' ? {
        id: 'npc-1',
        name: 'Gandalf',
        worldId: 'world-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined
    );

    // Mock the selector pattern - return the function directly
    mockUseNPCStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      if (selector) {
        return selector({
          npcs: {
            'npc-1': {
              id: 'npc-1',
              name: 'Gandalf',
              worldId: 'world-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          getById: mockGetById,
        });
      }
      return mockGetById;
    });

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-1',
      content: 'You shall not pass!',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'npc-1',
      },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getByText('Gandalf')).toBeInTheDocument();
    expect(screen.getByText('You shall not pass!')).toBeInTheDocument();
  });

  it('displays avatar if NPC has avatarUrl', () => {
    const mockGetById = jest.fn((id: string) =>
      id === 'npc-2' ? {
        id: 'npc-2',
        name: 'Aragorn',
        worldId: 'world-1',
        avatarUrl: 'https://example.com/aragorn.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined
    );

    mockUseNPCStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      if (selector) {
        return selector({
          npcs: {
            'npc-2': {
              id: 'npc-2',
              name: 'Aragorn',
              worldId: 'world-1',
              avatarUrl: 'https://example.com/aragorn.jpg',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          getById: mockGetById,
        });
      }
      return mockGetById;
    });

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-2',
      content: 'For Frodo!',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'npc-2',
      },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    const avatar = screen.getByRole('img', { name: /aragorn/i });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/aragorn.jpg');
  });

  it('renders dialogue without speaker when speakerId is not provided', () => {
    const dialogueSegment: NarrativeSegment = {
      id: 'segment-3',
      content: 'A mysterious voice echoes...',
      type: 'dialogue',
      metadata: {
        tags: [],
      },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getByText('A mysterious voice echoes...')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles missing NPC gracefully when speakerId does not match', () => {
    const mockGetById = jest.fn(() => undefined);

    mockUseNPCStore.mockImplementation((selector?: (state: unknown) => unknown) => {
      if (selector) {
        return selector({
          npcs: {},
          getById: mockGetById,
        });
      }
      return mockGetById;
    });

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-4',
      content: 'Unknown speaker dialogue',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'nonexistent-npc',
      },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getByText('Unknown speaker dialogue')).toBeInTheDocument();
  });
});
