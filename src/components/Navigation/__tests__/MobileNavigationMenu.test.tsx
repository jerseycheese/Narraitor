import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileNavigationMenu } from '../MobileNavigationMenu';

jest.mock('next/navigation', () => ({
  usePathname: () => '/worlds',
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: {},
    currentWorldId: null,
    setCurrentWorld: jest.fn(),
  }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({ characters: {} }),
}));

jest.mock('../TutorialMenu', () => ({
  TutorialMenu: () => <div data-testid="tutorial-menu">Tutorials</div>,
}));

describe('MobileNavigationMenu', () => {
  it('shows tutorial menu when mobile menu is open', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    expect(screen.getByTestId('tutorial-menu')).toBeInTheDocument();
  });
});
