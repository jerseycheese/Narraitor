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

  // Prose and decision are one document. Everything the player reads or acts
  // on has to sit inside the single scrolling region, because a second
  // scrolling row is what let the choice list resize the narrative each turn.
  it('puts every child inside the one scrolling region', () => {
    render(
      <ManuscriptSessionShell hud={<div data-testid="hud" />}>
        <div data-testid="narrative">Narrative</div>
        <div data-testid="decision">Decision</div>
      </ManuscriptSessionShell>
    );

    const measure = screen
      .getByTestId('manuscript-session-shell')
      .querySelector('.manuscript-overlay-main .manuscript-main-content-inner');

    expect(measure).toContainElement(screen.getByTestId('narrative'));
    expect(measure).toContainElement(screen.getByTestId('decision'));
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
