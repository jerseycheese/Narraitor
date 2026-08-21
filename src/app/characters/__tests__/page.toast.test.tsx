import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import CharactersPage from '../page';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { deleteCharacterWithCleanup } from '@/services/characterDeletionService';

// The card is stubbed down to the one affordance this flow needs.
jest.mock('@/components/CharacterCard', () => ({
  CharacterCard: ({ onDelete }: { onDelete: () => void }) => (
    <button onClick={onDelete}>Delete Aria</button>
  ),
}));

jest.mock('@/components/character/CharacterTable', () => ({
  CharacterTable: () => null,
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

const mockDeleteCharacter = deleteCharacterWithCleanup as jest.Mock;

function mockStores() {
  (useCharacterStore as unknown as jest.Mock).mockReturnValue({
    characters: { 'char-1': { id: 'char-1', name: 'Aria', worldId: 'world-1' } },
    currentCharacterId: null,
    setCurrentCharacter: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
  });
  (useWorldStore as unknown as jest.Mock).mockReturnValue({
    worlds: { 'world-1': { id: 'world-1', name: 'Fantasy Realm', genre: 'fantasy' } },
    currentWorldId: 'world-1',
    worldStates: {},
  });
  (useSessionStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector ? selector({ id: null }) : { id: null }
  );
  (useNarrativeStore as unknown as jest.Mock).mockReturnValue({
    getSessionSegments: jest.fn(() => []),
  });
}

function renderPage() {
  return render(
    <ToastProvider>
      <CharactersPage />
      <Toaster />
    </ToastProvider>
  );
}

async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Delete Aria' }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete Character Aria' })
  );
}

describe('CharactersPage delete notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    mockStores();
  });

  it('routes the success notification through the shared toast portal', async () => {
    mockDeleteCharacter.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { container } = renderPage();

    await confirmDelete(user);

    const portal = document.getElementById('toast-container');
    expect(portal).not.toBeNull();
    await waitFor(() => {
      expect(within(portal!).getByText('Character Deleted')).toBeInTheDocument();
    });
    expect(
      within(portal!).getByText('Aria has been permanently deleted')
    ).toBeInTheDocument();
    expect(
      within(portal!).getByText('Character Deleted').closest('.toast')
    ).toHaveAttribute('data-variant', 'success');

    // The page must not render a second toast of its own in document flow.
    expect(container.querySelector('.toast')).toBeNull();
  });

  it('routes the failure notification through the shared toast portal', async () => {
    mockDeleteCharacter.mockRejectedValue(new Error('nope'));
    const user = userEvent.setup();
    const { container } = renderPage();

    await confirmDelete(user);

    const portal = document.getElementById('toast-container');
    expect(portal).not.toBeNull();
    await waitFor(() => {
      expect(within(portal!).getByText('Delete Failed')).toBeInTheDocument();
    });
    expect(
      within(portal!).getByText('Delete Failed').closest('.toast')
    ).toHaveAttribute('data-variant', 'error');
    expect(container.querySelector('.toast')).toBeNull();
  });
});
