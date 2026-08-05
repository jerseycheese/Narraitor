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

  it('renders the active character portrait in the avatar pill when one exists (#1581)', () => {
    render(
      <ManuscriptFloatingHud
        {...baseProps}
        characterName="Finn"
        characterPortrait={{ type: 'ai-generated', url: 'data:image/png;base64,abc' }}
      />
    );

    const avatar = document.querySelector('.manuscript-hud-character-pill-avatar');
    expect(avatar?.querySelector('img')).not.toBeNull();
  });

  it('leaves the avatar pill empty when the character has no portrait', () => {
    render(<ManuscriptFloatingHud {...baseProps} characterName="Finn" />);

    const avatar = document.querySelector('.manuscript-hud-character-pill-avatar');
    expect(avatar?.querySelector('img')).toBeNull();
  });

  // At 8 icons wide, the HUD's auto-sized icon row overlaps the character
  // pill's clickable area on mobile viewports and steals its clicks (#276
  // review follow-up - a real layout bug, not a modal-gating one). The fix is
  // a mobile-only `display: none` keyed off this class; jsdom can't compute
  // real layout to catch the overlap itself, so this locks in the CSS hook
  // the fix depends on.
  it('marks the keyboard shortcuts trigger so it can be hidden on mobile (#276)', () => {
    render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

    const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
    expect(button).toHaveClass('manuscript-hud-shortcuts-button');
  });
});
