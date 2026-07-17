import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

/**
 * /dashboard hosts the app home moved off / (#1528). DashboardHome behavior
 * (first-time vs returning states) is covered by its own component spec.
 */

jest.mock('@/components/Dashboard', () => ({
  DashboardHome: () => <div data-testid="dashboard-home">Dashboard</div>,
}));

describe('DashboardPage (#1528)', () => {
  it('renders DashboardHome at the app home route', async () => {
    render(<DashboardPage />);

    // SSRClientOnly mounts children after the first client effect.
    expect(await screen.findByTestId('dashboard-home')).toBeInTheDocument();
  });
});
