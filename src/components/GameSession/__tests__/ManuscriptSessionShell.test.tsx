import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManuscriptSessionShell } from '../ManuscriptSessionShell';

describe('ManuscriptSessionShell', () => {
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

  // AppSurfaceShell already wraps the play route in the page's one main
  // landmark. A second <main> here nests landmarks, which is invalid and
  // leaves screen-reader landmark navigation with two "main" destinations.
  it('labels the narrative stage as a region rather than a second main landmark', () => {
    render(
      <ManuscriptSessionShell>
        <div>Main Content</div>
      </ManuscriptSessionShell>
    );

    const shell = screen.getByTestId('manuscript-session-shell');
    expect(shell.querySelector('main')).toBeNull();

    const stage = shell.querySelector('.manuscript-overlay-main');
    expect(stage?.tagName).toBe('SECTION');
    expect(stage).toHaveAttribute('aria-label', 'Story');
  });
});
