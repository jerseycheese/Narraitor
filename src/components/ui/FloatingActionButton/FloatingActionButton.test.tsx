import React from 'react';
import { render, screen } from '@testing-library/react';
import { FloatingActionButton } from './FloatingActionButton';

describe('FloatingActionButton', () => {
  it('applies the tutorial data attribute when provided', () => {
    render(
      <FloatingActionButton
        onClick={jest.fn()}
        icon={<span>icon</span>}
        label="Open journal"
        dataTutorialId="journal-toggle"
      />
    );

    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).toHaveAttribute('data-tutorial', 'journal-toggle');
  });

  it('omits the tutorial data attribute when not provided', () => {
    render(
      <FloatingActionButton
        onClick={jest.fn()}
        icon={<span>icon</span>}
        label="Open journal"
      />
    );

    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).not.toHaveAttribute('data-tutorial');
  });
});
