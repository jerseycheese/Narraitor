import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

/**
 * Public entry decision at / (#1528). Local-first "anonymous" means this
 * browser has no persisted worlds, characters, or saved sessions: those
 * visitors see the Landing front door, while returning browsers are routed
 * to /dashboard. The store mocks expose no persist API, which the redirect
 * gate treats as already-hydrated.
 */

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockWorldState: { worlds: Record<string, unknown> } = { worlds: {} };
const mockCharacterState: { characters: Record<string, unknown> } = {
  characters: {},
};
const mockSessionState: { savedSessions: Record<string, unknown> } = {
  savedSessions: {},
};

jest.mock('@/state/worldStore', () => ({
  useWorldStore: { getState: () => mockWorldState },
}));
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: { getState: () => mockCharacterState },
}));
jest.mock('@/state/sessionStore', () => ({
  useSessionStore: { getState: () => mockSessionState },
}));

describe('HomePage entry decision (#1528)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockWorldState.worlds = {};
    mockCharacterState.characters = {};
    mockSessionState.savedSessions = {};
  });

  it('shows the Landing page to an anonymous visitor without redirecting', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /answers to the world you built/i,
      })
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('routes a returning browser with worlds to /dashboard', () => {
    mockWorldState.worlds = { 'world-1': { id: 'world-1' } };

    render(<HomePage />);

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('routes a returning browser with only a saved session to /dashboard', () => {
    mockSessionState.savedSessions = { 'session-1': { id: 'session-1' } };

    render(<HomePage />);

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });
});
