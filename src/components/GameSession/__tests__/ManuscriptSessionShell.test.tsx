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
    expect(marginElement).toHaveClass('hidden');
    expect(marginElement).toHaveClass('lg:block');
  });
});
