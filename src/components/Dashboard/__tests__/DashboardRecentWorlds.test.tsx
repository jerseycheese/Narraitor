import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardRecentWorlds } from '../DashboardRecentWorlds';
import type { World } from '@/types/world.types';

describe('DashboardRecentWorlds', () => {
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
      updatedAt: '2024-01-03T00:00:00.000Z'
    },
    'world-2': {
      id: 'world-2',
      name: 'Sci-Fi Universe',
      genre: 'sci-fi',
      description: 'A futuristic world',
      attributes: [],
      skills: [],
      settings: { maxAttributes: 10, maxSkills: 20, attributePointPool: 50, skillPointPool: 30 },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z' // Most recent
    },
    'world-3': {
      id: 'world-3',
      name: 'Horror Town',
      genre: 'horror',
      description: 'A spooky world',
      attributes: [],
      skills: [],
      settings: { maxAttributes: 10, maxSkills: 20, attributePointPool: 50, skillPointPool: 30 },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z'
    }
  };

  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('displays worlds sorted by most recent updatedAt', () => {
    render(
      <DashboardRecentWorlds
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const worldNames = screen.getAllByText(/Realm|Universe|Town/);
    // Should be in order: Sci-Fi Universe, Horror Town, Fantasy Realm
    expect(worldNames[0]).toHaveTextContent('Sci-Fi Universe');
    expect(worldNames[1]).toHaveTextContent('Horror Town');
    expect(worldNames[2]).toHaveTextContent('Fantasy Realm');
  });

  it('limits display to maxItems', () => {
    render(
      <DashboardRecentWorlds
        worlds={mockWorlds}
        maxItems={2}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Sci-Fi Universe')).toBeInTheDocument();
    expect(screen.getByText('Horror Town')).toBeInTheDocument();
    expect(screen.queryByText('Fantasy Realm')).not.toBeInTheDocument();
  });

  it('shows empty state with create CTA when no worlds', () => {
    render(
      <DashboardRecentWorlds
        worlds={{}}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByRole('button', { name: /create.*world/i })).toBeInTheDocument();
  });

  it('shows partial empty slots when fewer than maxItems', () => {
    const singleWorld = { 'world-1': mockWorlds['world-1'] };

    render(
      <DashboardRecentWorlds
        worlds={singleWorld}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    // Should show 2 empty slots with create buttons
    const createButtons = screen.getAllByRole('button', { name: /create.*world/i });
    expect(createButtons).toHaveLength(2);
  });

  it('navigates to worlds page when create button clicked', async () => {
    const user = userEvent.setup();

    render(
      <DashboardRecentWorlds
        worlds={{}}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    const createButton = screen.getByRole('button', { name: /create.*world/i });
    await user.click(createButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('/worlds');
  });

  it('has proper heading for accessibility', () => {
    render(
      <DashboardRecentWorlds
        worlds={mockWorlds}
        maxItems={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByRole('heading', { name: /recent worlds/i })).toBeInTheDocument();
  });
});
