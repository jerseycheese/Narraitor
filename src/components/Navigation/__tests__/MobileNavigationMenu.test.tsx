import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('is a modal dialog so assistive tech knows the page behind it is inert (#1655)', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByRole('navigation', { name: 'Mobile navigation' })
    ).toBeInTheDocument();
  });

  it('traps Tab inside the drawer', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    const focusable = Array.from(dialog.querySelectorAll('button'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
