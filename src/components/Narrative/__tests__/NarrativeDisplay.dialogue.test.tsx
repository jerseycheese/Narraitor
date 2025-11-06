import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';
import { useNPCStore } from '@/state/npcStore';
import { mockZustandStore, createMockNPCStore } from '@/lib/test-utils';

jest.mock('@/state/npcStore');

describe('NarrativeDisplay - Dialogue with Speaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {},
      getById: jest.fn(() => undefined),
    }));
  });

  it('displays speaker name for dialogue segment with speakerId', () => {
    const mockGetById = jest.fn((id: string) =>
      id === 'npc-1' ? {
        id: 'npc-1',
        name: 'Gandalf',
        description: 'A wise wizard',
        worldId: 'world-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : undefined
    );

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {
        'npc-1': {
          id: 'npc-1',
          name: 'Gandalf',
          description: 'A wise wizard',
          worldId: 'world-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      getById: mockGetById,
    }));

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-1',
      content: 'You shall not pass!',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'npc-1',
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getAllByText('Gandalf')[0]).toBeInTheDocument();
    expect(screen.getByText('You shall not pass!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gandalf' })).toBeInTheDocument();
  });

  it('displays avatar if NPC has avatarUrl', () => {
    const mockGetById = jest.fn((id: string) =>
      id === 'npc-2' ? {
        id: 'npc-2',
        name: 'Aragorn',
        description: 'Ranger of the North',
        worldId: 'world-1',
        avatarUrl: 'https://example.com/aragorn.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : undefined
    );

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {
        'npc-2': {
          id: 'npc-2',
          name: 'Aragorn',
          description: 'Ranger of the North',
          worldId: 'world-1',
          avatarUrl: 'https://example.com/aragorn.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      getById: mockGetById,
    }));

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-2',
      content: 'For Frodo!',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'npc-2',
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    const avatar = screen.getByAltText(/aragorn/i);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getByText('A mysterious voice echoes...')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles missing NPC gracefully when speakerId does not match', () => {
    const mockGetById = jest.fn(() => undefined);

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {},
      getById: mockGetById,
    }));

    const dialogueSegment: NarrativeSegment = {
      id: 'segment-4',
      content: 'Unknown speaker dialogue',
      type: 'dialogue',
      metadata: {
        tags: [],
        speakerId: 'nonexistent-npc',
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<NarrativeDisplay segment={dialogueSegment} />);

    expect(screen.getByText('Unknown speaker dialogue')).toBeInTheDocument();
  });
});
