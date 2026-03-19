import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManuscriptFloatingHud } from '../ManuscriptFloatingHud';

// Mock useTheme to control which DS variant renders
const mockTheme = { theme: 'ds1', colorScheme: 'light', setTheme: jest.fn(), setColorScheme: jest.fn() };
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => mockTheme,
}));

describe('ManuscriptFloatingHud accessibility', () => {
  const baseProps = {
    onToggleCharacterSummary: jest.fn(),
    isCharacterSummaryExpanded: false,
    onToggleToolsMenu: jest.fn(),
    isToolsMenuOpen: false,
    drawerTriggers: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme.theme = 'ds1';
  });

  it('attaches characterButtonRef to the character button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <ManuscriptFloatingHud {...baseProps} characterButtonRef={ref} />
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain('Character');
  });

  it('attaches toolsButtonRef to the tools button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <ManuscriptFloatingHud {...baseProps} toolsButtonRef={ref} />
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute('aria-label', 'Toggle Tools menu');
  });

  it('moves focus into character panel when it opens', () => {
    const panelContent = <div>Character info</div>;
    render(
      <ManuscriptFloatingHud
        {...baseProps}
        isCharacterSummaryExpanded={true}
        characterSummaryPanel={panelContent}
      />
    );

    const panel = document.querySelector('.manuscript-hud-character-panel');
    expect(panel).toHaveFocus();
  });

  it('moves focus into tools panel when it opens', () => {
    const panelContent = <div>Tools menu</div>;
    render(
      <ManuscriptFloatingHud
        {...baseProps}
        isToolsMenuOpen={true}
        toolsMenuPanel={panelContent}
      />
    );

    const panel = document.querySelector('.manuscript-hud-panel:not(.manuscript-hud-character-panel)');
    expect(panel).toHaveFocus();
  });

  it('character button has aria-expanded reflecting panel state', () => {
    const { rerender } = render(
      <ManuscriptFloatingHud {...baseProps} isCharacterSummaryExpanded={false} />
    );

    const button = screen.getByText('Character');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <ManuscriptFloatingHud {...baseProps} isCharacterSummaryExpanded={true} />
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('tools button has aria-expanded reflecting menu state', () => {
    const { rerender } = render(
      <ManuscriptFloatingHud {...baseProps} isToolsMenuOpen={false} />
    );

    const button = screen.getByLabelText('Toggle Tools menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <ManuscriptFloatingHud {...baseProps} isToolsMenuOpen={true} />
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  describe('DS2 variant', () => {
    beforeEach(() => {
      mockTheme.theme = 'ds2';
    });

    it('attaches characterButtonRef to the character link button', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <ManuscriptFloatingHud {...baseProps} characterButtonRef={ref} characterName="Elara" />
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('Elara');
    });
  });

  describe('DS3 variant', () => {
    beforeEach(() => {
      mockTheme.theme = 'ds3';
    });

    it('attaches characterButtonRef to the character pill button', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <ManuscriptFloatingHud {...baseProps} characterButtonRef={ref} characterName="Finn" />
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('Finn');
    });
  });
});
