import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TermDefinition } from '../TermDefinition';
import type { TermDefinitionData } from '../useTermDefinitions';

const baseTerm: TermDefinitionData = {
  name: 'Aria',
  category: 'characters',
  type: 'protagonist',
  description: 'A powerful mage from the Northern Tower.',
  importance: 'high',
};

describe('TermDefinition', () => {
  it('renders term name and description', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(
      screen.getByText('A powerful mage from the Northern Tower.')
    ).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('characters')).toBeInTheDocument();
  });

  it('renders type when provided', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('protagonist')).toBeInTheDocument();
  });

  it('does not render type when not provided', () => {
    const termWithoutType: TermDefinitionData = {
      name: 'Northern Tower',
      category: 'locations',
      description: 'A tall tower in the north.',
    };

    render(
      <TermDefinition
        term={termWithoutType}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.queryByText('protagonist')).not.toBeInTheDocument();
  });

  it('calls onDismiss on Escape key press', () => {
    const onDismiss = jest.fn();

    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={onDismiss}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(true);
  });

  it('calls onDismiss on click outside', () => {
    const onDismiss = jest.fn();

    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={onDismiss}
      />
    );

    fireEvent.mouseDown(document.body);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(false);
  });

  it('does NOT dismiss on click inside', () => {
    const onDismiss = jest.fn();

    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={onDismiss}
      />
    );

    const aside = screen.getByRole('complementary');
    fireEvent.mouseDown(aside);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveAttribute('aria-label', 'Definition: Aria');
  });

  it('has tabIndex -1 for programmatic focus', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the panel on mount', () => {
    render(
      <TermDefinition
        term={baseTerm}
        onDismiss={jest.fn()}
      />
    );

    const aside = screen.getByRole('complementary');
    expect(document.activeElement).toBe(aside);
  });

  it('cleans up event listeners on unmount', () => {
    const onDismiss = jest.fn();

    const { unmount } = render(
      <TermDefinition
        term={baseTerm}
        onDismiss={onDismiss}
      />
    );

    unmount();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
