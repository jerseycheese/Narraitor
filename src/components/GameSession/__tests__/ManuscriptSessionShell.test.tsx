import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManuscriptSessionShell } from '../ManuscriptSessionShell';

jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'ds1', colorScheme: 'light', resolvedColorScheme: 'light', setTheme: jest.fn(), setColorScheme: jest.fn() }),
}));

describe('ManuscriptSessionShell', () => {
  beforeAll(() => {
    // Mock global CSS variables that would normally come from globals.css
    document.body.style.setProperty('--color-overlay-surface', 'rgba(255, 255, 255, 0.9)');
    document.body.style.setProperty('--color-overlay-surface-strong', 'rgba(255, 255, 255, 0.95)');
    document.body.style.setProperty('--color-manuscript-gradient-start', 'rgba(255, 255, 255, 0.92)');
    document.body.style.setProperty('--color-manuscript-gradient-end', 'rgba(244, 244, 245, 0.92)');
    document.body.style.setProperty('--color-scrim', 'rgba(17, 17, 17, 0.45)');
    document.body.style.setProperty('--shadow-overlay', '0 6px 18px rgba(0, 0, 0, 0.08)');
  });

  afterAll(() => {
    document.body.style.removeProperty('--color-overlay-surface');
    document.body.style.removeProperty('--color-overlay-surface-strong');
    document.body.style.removeProperty('--color-manuscript-gradient-start');
    document.body.style.removeProperty('--color-manuscript-gradient-end');
    document.body.style.removeProperty('--color-scrim');
    document.body.style.removeProperty('--shadow-overlay');
  });

  it('renders children and hud', () => {
    render(
      <ManuscriptSessionShell hud={<div data-testid="hud" />}>
        <div data-testid="children">Main Content</div>
      </ManuscriptSessionShell>
    );

    expect(screen.getByTestId('hud')).toBeInTheDocument();
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders marginContent when provided', () => {
    render(
      <ManuscriptSessionShell marginContent={<div data-testid="margin">Margin</div>}>
        <div>Main Content</div>
      </ManuscriptSessionShell>
    );

    expect(screen.getByTestId('margin')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
  });

  it('has correct layout classes for margin content', () => {
    render(
      <ManuscriptSessionShell marginContent={<div data-testid="margin">Margin</div>}>
        <div>Main Content</div>
      </ManuscriptSessionShell>
    );

    const marginElement = screen.getByTestId('margin').parentElement;
    expect(marginElement).toHaveClass('manuscript-characters-rail');
  });

  it('exposes manuscript overlay CSS variables', () => {
    render(
      <ManuscriptSessionShell>
        <div>Main Content</div>
      </ManuscriptSessionShell>
    );

    // In JSDOM, getComputedStyle doesn't always handle inherited custom properties well.
    // We check document.body.style directly to verify they are defined in the environment.
    expect(document.body.style.getPropertyValue('--color-overlay-surface')).not.toBe('');
    expect(document.body.style.getPropertyValue('--color-overlay-surface-strong')).not.toBe('');
    expect(document.body.style.getPropertyValue('--color-manuscript-gradient-start')).not.toBe('');
    expect(document.body.style.getPropertyValue('--color-manuscript-gradient-end')).not.toBe('');
    expect(document.body.style.getPropertyValue('--color-scrim')).not.toBe('');
    expect(document.body.style.getPropertyValue('--shadow-overlay')).not.toBe('');
  });

  it('uses semantic manuscript overlay classes', () => {
    render(
      <ManuscriptSessionShell hud={<div data-testid="hud" />}>
        <div data-testid="children">Main Content</div>
      </ManuscriptSessionShell>
    );

    const shell = screen.getByTestId('manuscript-session-shell');
    expect(shell).toHaveClass('manuscript-viewport-layer');

    // These will fail until Task 3 Step 3
    const backdrop = shell.querySelector('.manuscript-overlay-backdrop');
    expect(backdrop).toBeInTheDocument();

    const viewportShell = shell.querySelector('.manuscript-viewport-shell');
    expect(viewportShell).toBeInTheDocument();

    const viewportInner = shell.querySelector('.manuscript-viewport-inner');
    expect(viewportInner).toBeInTheDocument();

    const main = shell.querySelector('.manuscript-overlay-main');
    expect(main).toBeInTheDocument();

    const header = shell.querySelector('.manuscript-overlay-header');
    expect(header).toBeInTheDocument();
  });

  it('applies mobile-first stack classes to the main stage and character rail', () => {
    render(
      <ManuscriptSessionShell marginContent={<div data-testid="margin">Margin</div>}>
        <div>Main Content</div>
      </ManuscriptSessionShell>
    );

    const shell = screen.getByTestId('manuscript-session-shell');
    const mainStage = shell.querySelector('.manuscript-main-stage');
    const characterRail = shell.querySelector('.manuscript-characters-rail');

    expect(mainStage).toHaveClass('manuscript-main-stage-mobile-stack');
    expect(characterRail).toHaveClass('manuscript-characters-rail-mobile-stack');
  });
});
