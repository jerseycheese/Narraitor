import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldSwitcher } from '../WorldSwitcher';

const mockNavigationData = {
  pathname: '/dashboard',
  currentWorldId: 'world-1',
  worlds: {
    'world-1': { id: 'world-1', name: 'Cyberpunk Neo-Tokyo', genre: 'scifi' },
  },
  characters: {},
  currentWorld: {
    id: 'world-1',
    name: 'Cyberpunk Neo-Tokyo',
    genre: 'scifi',
  },
  hasWorldsStore: true,
  worldCharacterCount: 0,
  navigateWithLoading: jest.fn(),
  setCurrentWorld: jest.fn(),
};

jest.mock('../useNavigationData', () => ({
  useNavigationData: () => mockNavigationData,
}));

describe('WorldSwitcher', () => {
  const openSwitcher = () => {
    const trigger = screen.getByRole('button', { name: /Cyberpunk Neo-Tokyo/ });
    fireEvent.click(trigger);
    return trigger;
  };

  it('opens the world list from the trigger', () => {
    render(<WorldSwitcher />);

    const trigger = openSwitcher();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Create a world')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<WorldSwitcher />);

    const trigger = openSwitcher();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Create a world')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
