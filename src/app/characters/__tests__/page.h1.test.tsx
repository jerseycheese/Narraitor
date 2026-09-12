import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import CharactersPage from '../page';
import { ToastProvider } from '@/components/ui/toast';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';

// Heavy children are irrelevant to the heading hierarchy under test.
jest.mock('@/components/CharacterCard', () => ({
  CharacterCard: () => <div data-testid="character-card" />,
}));

jest.mock('@/components/character/CharacterTable', () => ({
  CharacterTable: () => <div data-testid="character-table" />,
}));

jest.mock('@/components/GenerateCharacterDialog', () => ({
  GenerateCharacterDialog: () => null,
}));

jest.mock('@/services/characterDeletionService', () => ({
  deleteCharacterWithCleanup: jest.fn(),
}));

jest.mock('@/lib/api/generatePortrait', () => ({
  generatePortrait: jest.fn(),
}));

jest.mock('@/lib/api/characterApi', () => ({
  characterApi: { generateCharacter: jest.fn() },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn(),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(),
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: jest.fn(),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: jest.fn(),
}));

const mockCharacter = {
  id: 'char-1',
  name: 'Aria',
  worldId: 'world-1',
};

const mockWorldWithImage = {
  id: 'world-1',
  name: 'Fantasy Realm',
  genre: 'fantasy',
  // A world image suppresses the visible PageLayout header — the populated
  // state that previously rendered with no page-level <h1> (#1530).
  image: { url: 'https://example.test/world.png', type: 'ai-generated' },
};

function mockStores({ populated }: { populated: boolean }) {
  (useCharacterStore as unknown as jest.Mock).mockReturnValue({
    characters: populated ? { 'char-1': mockCharacter } : {},
    currentCharacterId: null,
    setCurrentCharacter: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
  });
  (useWorldStore as unknown as jest.Mock).mockReturnValue({
    worlds: populated ? { 'world-1': mockWorldWithImage } : {},
    currentWorldId: populated ? 'world-1' : null,
    worldStates: {},
  });
  (useSessionStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector ? selector({ id: null }) : { id: null }
  );
  (useNarrativeStore as unknown as jest.Mock).mockReturnValue({
    getSessionSegments: jest.fn(() => []),
  });
}

describe('CharactersPage heading hierarchy (#1530)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders exactly one page-level h1 when populated with a world hero', async () => {
    mockStores({ populated: true });

    render(
      <ToastProvider>
        <CharactersPage />
      </ToastProvider>
    );

    const h1s = await screen.findAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('My Characters');

    // The world hero stays a section heading under the page heading.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Fantasy Realm' })
    ).toBeInTheDocument();
  });

  it('renders exactly one page-level h1 in the empty no-world state', async () => {
    mockStores({ populated: false });

    render(
      <ToastProvider>
        <CharactersPage />
      </ToastProvider>
    );

    const h1s = await screen.findAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('My Characters');
  });
});

// Exactly one filled ink-blue CTA per rendered state. The toolbar owns it on
// the world's roster; the no-world state routes to Worlds instead.
describe('CharactersPage action hierarchy (#2083)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  // The view toggle marks its selected mode with button-default too, so filter
  // on aria-pressed to count only real CTAs.
  function primaryCtas(container: HTMLElement) {
    return Array.from(
      container.querySelectorAll<HTMLButtonElement>('.button-default')
    ).filter((button) => !button.hasAttribute('aria-pressed'));
  }

  function renderEmptyRoster() {
    mockStores({ populated: true });
    (useCharacterStore as unknown as jest.Mock).mockReturnValue({
      characters: {},
      currentCharacterId: null,
      setCurrentCharacter: jest.fn(),
      createCharacter: jest.fn(),
      updateCharacter: jest.fn(),
    });

    return render(
      <ToastProvider>
        <CharactersPage />
      </ToastProvider>
    );
  }

  it('gives the empty roster one Create Character, and it is the primary', async () => {
    const { container } = renderEmptyRoster();

    await screen.findByRole('heading', {
      level: 2,
      name: 'No characters in Fantasy Realm yet',
    });

    const createButtons = screen.getAllByRole('button', {
      name: 'Create Character',
    });
    expect(createButtons).toHaveLength(1);
    expect(createButtons[0]).toHaveClass('button-default');
    expect(primaryCtas(container)).toHaveLength(1);
  });

  it('drops the toolbar and its view toggle from the empty roster (#2099)', async () => {
    const { container } = renderEmptyRoster();

    await screen.findByRole('heading', {
      level: 2,
      name: 'No characters in Fantasy Realm yet',
    });

    expect(container.querySelector('.characters-toolbar')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /table view/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /generate character/i })
    ).toHaveLength(1);
  });

  it('leaves the no-world state with Go to Worlds as its only primary', async () => {
    mockStores({ populated: false });

    const { container } = render(
      <ToastProvider>
        <CharactersPage />
      </ToastProvider>
    );

    await screen.findByText('Choose Your World');

    const primaries = primaryCtas(container);
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent('Go to Worlds');
  });
});
