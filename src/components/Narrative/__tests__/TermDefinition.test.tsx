import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TermDefinition } from '../TermDefinition';
import type { TermDefinitionData } from '../useTermDefinitions';

const mockAnchorRect = {
  top: 100,
  right: 200,
  bottom: 120,
  left: 50,
  width: 150,
  height: 20,
  x: 50,
  y: 100,
  toJSON: () => ({}),
} as DOMRect;

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
        anchorRect={mockAnchorRect}
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
        anchorRect={mockAnchorRect}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('characters')).toBeInTheDocument();
  });

  it('renders type when provided', () => {
    render(
      <TermDefinition
        term={baseTerm}
        anchorRect={mockAnchorRect}
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
        anchorRect={mockAnchorRect}
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
        anchorRect={mockAnchorRect}
        onDismiss={onDismiss}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss on click outside', () => {
    const onDismiss = jest.fn();

    render(
      <TermDefinition
        term={baseTerm}
        anchorRect={mockAnchorRect}
        onDismiss={onDismiss}
      />
    );

    fireEvent.mouseDown(document.body);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT dismiss on click inside', () => {
    const onDismiss = jest.fn();

    render(
      <TermDefinition
        term={baseTerm}
        anchorRect={mockAnchorRect}
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
        anchorRect={mockAnchorRect}
        onDismiss={jest.fn()}
      />
    );

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveAttribute('aria-label', 'Definition: Aria');
  });

  it('cleans up event listeners on unmount', () => {
    const onDismiss = jest.fn();

    const { unmount } = render(
      <TermDefinition
        term={baseTerm}
        anchorRect={mockAnchorRect}
        onDismiss={onDismiss}
      />
    );

    unmount();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
