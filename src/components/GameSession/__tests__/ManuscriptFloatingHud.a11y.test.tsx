import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  // Issue #265: a click anywhere outside the pill/panel closes it, so an open
  // panel doesn't sit over the narrative until the player finds the tiny
  // trigger again or reaches for Escape.
  it('closes the character panel on an outside click', () => {
    const onToggleCharacterSummary = jest.fn();
    render(
      <div>
        <div data-testid="outside">Narrative text</div>
        <ManuscriptFloatingHud
          {...baseProps}
          onToggleCharacterSummary={onToggleCharacterSummary}
          isCharacterSummaryExpanded={true}
          characterSummaryPanel={<div>Character info</div>}
        />
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(onToggleCharacterSummary).toHaveBeenCalledTimes(1);
  });

  it('leaves the character panel open on a click inside it', () => {
    const onToggleCharacterSummary = jest.fn();
    render(
      <ManuscriptFloatingHud
        {...baseProps}
        onToggleCharacterSummary={onToggleCharacterSummary}
        isCharacterSummaryExpanded={true}
        characterSummaryPanel={<div>Character info</div>}
      />
    );

    fireEvent.mouseDown(screen.getByText('Character info'));

    expect(onToggleCharacterSummary).not.toHaveBeenCalled();
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

  // The icon row is a toolbar, not eight separate destinations. Left as
  // eight tab stops it sits between the top of the page and the choices, so
  // reaching an action costs eight extra presses on every single turn.
  describe('session tools toolbar', () => {
    const getTools = () =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>('.manuscript-hud-icon-button')
      );

    it('exposes the icon row as one named toolbar', () => {
      render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

      expect(
        screen.getByRole('toolbar', { name: 'Session tools' })
      ).toHaveClass('manuscript-ds3-controls');
    });

    it('keeps exactly one tool in the tab cycle', () => {
      render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

      const tools = getTools();
      expect(tools.length).toBeGreaterThan(1);
      expect(tools.filter((tool) => tool.tabIndex === 0)).toHaveLength(1);
      expect(tools[0].tabIndex).toBe(0);
    });

    it('moves between tools with arrow keys, wrapping at both ends', () => {
      render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

      const toolbar = screen.getByRole('toolbar', { name: 'Session tools' });
      const tools = getTools();
      const last = tools[tools.length - 1];

      tools[0].focus();
      fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
      expect(tools[1]).toHaveFocus();

      fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
      fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
      expect(last).toHaveFocus();

      fireEvent.keyDown(toolbar, { key: 'Home' });
      expect(tools[0]).toHaveFocus();

      fireEvent.keyDown(toolbar, { key: 'End' });
      expect(last).toHaveFocus();
    });

    // The shortcuts trigger is display:none on phones. Arrowing onto a box
    // that isn't laid out silently drops focus, so it can't be in the set.
    it('skips tools hidden by CSS', () => {
      render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

      const toolbar = screen.getByRole('toolbar', { name: 'Session tools' });
      const shortcuts = screen.getByRole('button', {
        name: /keyboard shortcuts/i,
      });
      const choiceHistory = screen.getByRole('button', {
        name: /choice history/i,
      });
      const resetSession = screen.getByRole('button', {
        name: /reset session/i,
      });
      shortcuts.style.display = 'none';

      choiceHistory.focus();
      fireEvent.keyDown(toolbar, { key: 'ArrowRight' });

      expect(resetSession).toHaveFocus();
    });

    it('leaves the last used tool as the tab stop', () => {
      render(<ManuscriptFloatingHud {...baseProps} onShowShortcuts={jest.fn()} />);

      const tools = getTools();
      fireEvent.focus(tools[2], { target: tools[2] });

      expect(tools[2].tabIndex).toBe(0);
      expect(tools[0].tabIndex).toBe(-1);
    });
  });
});
