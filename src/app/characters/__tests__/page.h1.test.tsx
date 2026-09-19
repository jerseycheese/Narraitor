import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
  GenerateCharacterDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Generate Character" /> : null,
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
  // A world with art gets the decorative banner above the roster.
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
    expect(h1s[0]).not.toHaveClass('sr-only');

    // The banner is decorative: the world switcher already names the world,
    // so the band carries no heading of its own.
    expect(
      screen.queryByRole('heading', { name: 'Fantasy Realm' })
    ).not.toBeInTheDocument();
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

  it('places action buttons in PageLayout actions slot and only view toggle in toolbar (#2122)', async () => {
    mockStores({ populated: true });

    const { container } = render(
      <ToastProvider>
        <CharactersPage />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'My Characters' });

    // PageLayout actions slot contains Create Character and Generate Character
    const headerActions = container.querySelector<HTMLElement>('.page-layout-actions');
    expect(headerActions).not.toBeNull();
    expect(
      within(headerActions!).getByRole('button', { name: 'Create Character' })
    ).toBeInTheDocument();
    expect(
      within(headerActions!).getByRole('button', { name: 'Generate Character' })
    ).toBeInTheDocument();

    // The body toolbar contains only the view toggle, not action buttons
    const toolbar = container.querySelector<HTMLElement>('.characters-toolbar');
    expect(toolbar).not.toBeNull();
    expect(
      within(toolbar!).getByRole('button', { name: /grid view/i })
    ).toBeInTheDocument();
    expect(
      within(toolbar!).getByRole('button', { name: /table view/i })
    ).toBeInTheDocument();
    expect(
      within(toolbar!).queryByRole('button', { name: 'Create Character' })
    ).toBeNull();
    expect(
      within(toolbar!).queryByRole('button', { name: 'Generate Character' })
    ).toBeNull();
  });

  it('provides Create Character in header actions and empty state when roster is empty (#2122)', async () => {
    const { container } = renderEmptyRoster();

    await screen.findByRole('heading', {
      level: 2,
      name: 'No characters in Fantasy Realm yet',
    });

    // Header actions slot has Create Character
    const headerActions = container.querySelector<HTMLElement>('.page-layout-actions');
    expect(headerActions).not.toBeNull();
    expect(
      within(headerActions!).getByRole('button', { name: 'Create Character' })
    ).toHaveClass('button-default');

    // Empty state has Create Character
    const emptyState = container.querySelector<HTMLElement>('.characters-empty');
    expect(emptyState).not.toBeNull();
    expect(
      within(emptyState!).getByRole('button', { name: 'Create Character' })
    ).toHaveClass('button-default');
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
  });

  it('opens the generate dialog from the empty roster instead of generating blind', async () => {
    const { container } = renderEmptyRoster();

    const emptyState = container.querySelector<HTMLElement>('.characters-empty');
    expect(emptyState).not.toBeNull();

    fireEvent.click(
      within(emptyState!).getByRole('button', { name: /generate character/i })
    );

    expect(
      await screen.findByRole('dialog', { name: 'Generate Character' })
    ).toBeInTheDocument();
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
