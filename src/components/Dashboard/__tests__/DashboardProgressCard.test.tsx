import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardProgressCard } from '../DashboardProgressCard';
import type { DashboardMetrics } from '@/types/dashboard.types';

describe('DashboardProgressCard', () => {
  const mockMetrics: DashboardMetrics = {
    worldsCreated: 3,
    charactersCreated: 5,
    sessionsPlayed: 2,
    narrativeSegments: 47
  };

  it('displays all four metrics correctly', () => {
    render(<DashboardProgressCard metrics={mockMetrics} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('displays metric labels', () => {
    render(<DashboardProgressCard metrics={mockMetrics} />);

    expect(screen.getByText(/Worlds/i)).toBeInTheDocument();
    expect(screen.getByText(/Characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Entries/i)).toBeInTheDocument();
  });

  it('shows zero state for new users', () => {
    const zeroMetrics: DashboardMetrics = {
      worldsCreated: 0,
      charactersCreated: 0,
      sessionsPlayed: 0,
      narrativeSegments: 0
    };

    render(<DashboardProgressCard metrics={zeroMetrics} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<DashboardProgressCard metrics={mockMetrics} />);

    expect(screen.getByRole('region')).toHaveAccessibleName(/progress/i);
  });
});
