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

jest.mock('../ThemeMenu', () => ({
  ThemeMenu: () => <div data-testid="theme-menu">Appearance</div>,
}));

describe('MobileNavigationMenu', () => {
  it('shows appearance and tutorial menus when mobile menu is open', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    expect(screen.getByTestId('theme-menu')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-menu')).toBeInTheDocument();
  });
});
