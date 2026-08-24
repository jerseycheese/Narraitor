import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// crypto.subtle isn't available in jsdom — mock the encryption layer so the
// store's removeProvider can run (it clears the key after the last removal).
jest.mock('@/lib/storage/encryption', () => ({
  encryptSecret: jest.fn(async (plaintext: string) => ({ ciphertext: `ct:${plaintext}`, iv: 'iv' })),
  decryptSecret: jest.fn(async (p: { ciphertext: string }) => p.ciphertext.replace(/^ct:/, '')),
  clearEncryptionKey: jest.fn(async () => {}),
}));

jest.mock('@/components/shared/PageLayout', () => ({
  PageLayout: function MockPageLayout({
    title,
    actions,
    children,
  }: {
    title: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <main>
        <h1>{title}</h1>
        {actions}
        {children}
      </main>
    );
  },
}));

// Lightweight stand-in so the test exercises the page wiring, not Radix
// internals (same convention as WorldListScreen's tests).
jest.mock('@/components/DeleteConfirmationDialog/DeleteConfirmationDialog', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemName,
    confirmButtonText,
    isDeleting,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemName: string;
    confirmButtonText?: string;
    isDeleting?: boolean;
  }) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title}>
        <p>{description}</p>
        <p>{itemName}</p>
        <button onClick={onClose} disabled={isDeleting}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isDeleting}>
          {confirmButtonText || 'Delete'}
        </button>
      </div>
    );
  },
}));

import ProvidersSettingsPage from '../page';
import { useProviderStore } from '@/state/providerStore';
import { clearEncryptionKey } from '@/lib/storage/encryption';
import type { ProviderConfig } from '@/types/provider.types';

const makeProvider = (id: string, name: string): ProviderConfig => ({
  id,
  type: 'gemini',
  name,
  endpoint: 'https://example.test',
  encryptedApiKey: 'ct:key',
  model: 'gemini-2.5-flash',
  capabilities: { text: true, images: false, streaming: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

let removeSpy: jest.Mock;

const seedProviders = (providers: ProviderConfig[], activeProviderId: string | null) => {
  useProviderStore.setState({
    providers: Object.fromEntries(providers.map((p) => [p.id, p])),
    activeProviderId,
  });
  // Wrap the real implementation so calls are observable and removal still happens.
  removeSpy = jest.fn(useProviderStore.getState().removeProvider);
  useProviderStore.setState({ removeProvider: removeSpy });
};

beforeEach(() => {
  localStorage.clear();
  useProviderStore.getState().reset();
  jest.clearAllMocks();
});

describe('ProvidersSettingsPage — remove confirmation', () => {
  test('clicking Remove opens a confirmation instead of removing immediately', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(screen.getByRole('dialog', { name: /remove provider/i })).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(useProviderStore.getState().providers['p1']).toBeDefined();
  });

  test('cancel keeps the provider untouched', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(useProviderStore.getState().providers['p1']).toBeDefined();
    expect(screen.getByText('Visual QA Gemini')).toBeInTheDocument();
  });

  test('confirming the last provider removes it, warns about the key, and clears it', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    const dialog = screen.getByRole('dialog', { name: /remove provider/i });
    expect(within(dialog).getByText(/clears the encryption key/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith('p1'));
    await screen.findByText(/no provider yet/i);
    expect(useProviderStore.getState().providers['p1']).toBeUndefined();
    await waitFor(() => expect(clearEncryptionKey).toHaveBeenCalled());
  });

  test('removing the active provider (with others saved) warns about the switch', async () => {
    seedProviders([makeProvider('p1', 'Primary'), makeProvider('p2', 'Backup')], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    const card = screen.getByText('Primary').closest('.component-provider-card') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: /remove/i }));

    const dialog = screen.getByRole('dialog', { name: /remove provider/i });
    expect(within(dialog).getByText(/currently in use/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith('p1'));
    expect(useProviderStore.getState().providers['p1']).toBeUndefined();
    expect(useProviderStore.getState().activeProviderId).toBe('p2');
    expect(clearEncryptionKey).not.toHaveBeenCalled();
  });

  test('double-clicking confirm only starts one removal', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    let resolveRemoval!: () => void;
    removeSpy = jest.fn(
      () => new Promise<void>((resolve) => { resolveRemoval = resolve; })
    );
    useProviderStore.setState({ removeProvider: removeSpy });
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    const dialog = screen.getByRole('dialog', { name: /remove provider/i });
    const confirmButton = within(dialog).getByRole('button', { name: /^remove$/i });

    await user.click(confirmButton);
    await user.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    await act(async () => resolveRemoval());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('cancel is inert while removal is in flight, and removal still completes', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    let resolveRemoval!: () => void;
    removeSpy = jest.fn(
      () => new Promise<void>((resolve) => { resolveRemoval = resolve; })
    );
    useProviderStore.setState({ removeProvider: removeSpy });
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    const dialog = screen.getByRole('dialog', { name: /remove provider/i });
    await user.click(within(dialog).getByRole('button', { name: /^remove$/i }));

    // Once confirmed, removal runs to completion: cancel must neither close
    // the dialog early nor stop the removal.
    const cancelButton = within(dialog).getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
    await user.click(cancelButton);
    expect(screen.getByRole('dialog', { name: /remove provider/i })).toBeInTheDocument();

    await act(async () => resolveRemoval());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('ProvidersSettingsPage — advanced settings', () => {
  test('a change in the Advanced panel persists onto the provider in the store', async () => {
    seedProviders([makeProvider('p1', 'Visual QA Gemini')], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /expand advanced/i }));
    const maxTokens = screen.getByLabelText(/max response length/i);
    await user.type(maxTokens, '2048');
    await user.tab();

    expect(useProviderStore.getState().providers['p1'].advancedSettings).toEqual({
      maxTokens: 2048,
    });
  });

  test('Reset to defaults clears a previously saved override from the store', async () => {
    const provider = { ...makeProvider('p1', 'Visual QA Gemini'), advancedSettings: { temperature: 1.8 } };
    seedProviders([provider], 'p1');
    const user = userEvent.setup();
    render(<ProvidersSettingsPage />);

    await user.click(screen.getByRole('button', { name: /expand advanced/i }));
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));

    expect(useProviderStore.getState().providers['p1'].advancedSettings).toBeUndefined();
  });
});
