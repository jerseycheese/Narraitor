import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppSurfaceShell } from '../AppSurfaceShell';

let mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('@/components/Navigation', () => ({
  HeaderNavigation: () => <div data-testid="header-nav" />,
}));

describe('AppSurfaceShell', () => {
  it('renders the app chrome on non-play routes', () => {
    mockPathname = '/worlds';

    const { container } = render(
      <AppSurfaceShell>
        <p>content</p>
      </AppSurfaceShell>
    );

    expect(screen.getByTestId('header-nav')).toBeInTheDocument();
    expect(container.querySelector('.app-surface-inner')).not.toBeNull();
    expect(container.querySelector('[data-surface-mode="app"]')).not.toBeNull();
  });

  it('renders the chrome-free manuscript surface on play routes', () => {
    mockPathname = '/worlds/world-1/play';

    const { container } = render(
      <AppSurfaceShell>
        <p>content</p>
      </AppSurfaceShell>
    );

    expect(screen.queryByTestId('header-nav')).not.toBeInTheDocument();
    expect(container.querySelector('.app-surface-inner')).toBeNull();
    expect(
      container.querySelector('[data-surface-mode="manuscript"]')
    ).not.toBeNull();
  });

  it.each([
    ['/about', 'brand'],
    ['/', 'brand'],
    ['/worlds', 'product'],
    ['/dashboard', 'product'],
  ])('tags %s with the %s register', (pathname, register) => {
    mockPathname = pathname;

    const { container } = render(
      <AppSurfaceShell>
        <p>content</p>
      </AppSurfaceShell>
    );

    expect(
      container.querySelector('[data-surface-mode="app"]')
    ).toHaveAttribute('data-register', register);
  });

  // The manuscript surface is chrome-free, so it has no brand/product
  // distinction to make. Absent, not 'product'.
  it('leaves the manuscript surface unregistered', () => {
    mockPathname = '/worlds/world-1/play';

    const { container } = render(
      <AppSurfaceShell>
        <p>content</p>
      </AppSurfaceShell>
    );

    const surface = container.querySelector('[data-surface-mode="manuscript"]');
    expect(surface).not.toBeNull();
    expect(surface?.hasAttribute('data-register')).toBe(false);
  });
});
