import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardRecentCharacters } from '../DashboardRecentCharacters';
import type { Character } from '@/state/characterStore';
import type { World } from '@/types/world.types';

describe('DashboardRecentCharacters', () => {
  const mockWorlds: Record<string, World> = {
    'world-1': {
      id: 'world-1',
      name: 'Fantasy Realm',
      genre: 'fantasy',
      description: 'A magical world',
      attributes: [],
      skills: [],
      settings: { maxAttributes: 10, maxSkills: 20, attributePointPool: 50, skillPointPool: 30 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  };

  const mockCharacters: Record<string, Character> = {
    'char-1': {
      id: 'char-1',
      worldId: 'world-1',
      name: 'Aragorn',
      description: 'A ranger',
      portrait: { type: 'placeholder', url: null },
      level: 5,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
      status: { conditions: [] },
      inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z'
    },
    'char-2': {
      id: 'char-2',
      worldId: 'world-1',
      name: 'Gandalf',
      description: 'A wizard',
      portrait: { type: 'placeholder', url: null },
      level: 10,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
      status: { conditions: [] },
      inventory: { characterId: 'char-2', items: [], capacity: 10, categories: [], itemOrder: [] },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z' // Most recent
    },
    'char-3': {
      id: 'char-3',
      worldId: 'world-1',
      name: 'Frodo',
      description: 'A hobbit',
      portrait: { type: 'placeholder', url: null },
      level: 3,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
      status: { conditions: [] },
      inventory: { characterId: 'char-3', items: [], capacity: 10, categories: [], itemOrder: [] },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z'
    }
  };

  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('displays characters sorted by most recent updatedAt', () => {
    render(
      <DashboardRecentCharacters
        characters={mockCharacters}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const characterNames = screen.getAllByText(/Aragorn|Gandalf|Frodo/);
    // Should be in order: Gandalf, Frodo, Aragorn
    expect(characterNames[0]).toHaveTextContent('Gandalf');
    expect(characterNames[1]).toHaveTextContent('Frodo');
    expect(characterNames[2]).toHaveTextContent('Aragorn');
  });

  it('limits display to maxItems', () => {
    render(
      <DashboardRecentCharacters
        characters={mockCharacters}
        worlds={mockWorlds}
        maxItems={2}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Gandalf')).toBeInTheDocument();
    expect(screen.getByText('Frodo')).toBeInTheDocument();
    expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
  });

  it('shows empty state with create CTA when no characters', () => {
    render(
      <DashboardRecentCharacters
        characters={{}}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByRole('button', { name: /create.*character/i })).toBeInTheDocument();
  });

  it('displays world name for each character', () => {
    render(
      <DashboardRecentCharacters
        characters={mockCharacters}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const worldReferences = screen.getAllByText('Fantasy Realm');
    expect(worldReferences.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to characters page when create button clicked', async () => {
    const user = userEvent.setup();

    render(
      <DashboardRecentCharacters
        characters={{}}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const createButton = screen.getByRole('button', { name: /create.*character/i });
    await user.click(createButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('/characters');
  });

  it('recent character items have design system styling', () => {
    render(
      <DashboardRecentCharacters
        characters={mockCharacters}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const characterItems = screen.getAllByRole('button').filter(
      el => el.classList.contains('dashboard-recent-item')
    );
    expect(characterItems).toHaveLength(3);
  });

  it('has proper heading for accessibility', () => {
    render(
      <DashboardRecentCharacters
        characters={mockCharacters}
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByRole('heading', { name: /recent characters/i })).toBeInTheDocument();
  });
});
