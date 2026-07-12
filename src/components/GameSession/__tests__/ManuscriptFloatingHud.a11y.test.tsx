import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManuscriptFloatingHud } from '../ManuscriptFloatingHud';

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
  });

  it('attaches characterButtonRef to the character button', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <ManuscriptFloatingHud {...baseProps} characterButtonRef={ref} />
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain('Character');
  });

  it('attaches characterButtonRef with a custom character name', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <ManuscriptFloatingHud {...baseProps} characterButtonRef={ref} characterName="Finn" />
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain('Finn');
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

  it('character button has aria-expanded reflecting panel state', () => {
    const { rerender } = render(
      <ManuscriptFloatingHud {...baseProps} isCharacterSummaryExpanded={false} />
    );

    const button = screen.getByRole('button', { name: /character/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <ManuscriptFloatingHud {...baseProps} isCharacterSummaryExpanded={true} />
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
