import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ProvidersSettingsPage from '../page';
import { useProviderStore } from '@/state/providerStore';
import type { ProviderConfig } from '@/types/provider.types';

jest.mock('@/components/shared/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <main className="mock-page-layout">{children}</main>
  ),
}));

const makeProvider = (id: string, name: string): ProviderConfig => ({
  id,
  type: 'openai-compatible',
  name,
  endpoint: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-chat',
  capabilities: { text: true, images: false, streaming: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('ProvidersSettingsPage hydration', () => {
  test.each([true, false])(
    'waits for delayed storage before showing providers (saved: %s)',
    async (hasSavedProvider) => {
      await useProviderStore.persist.rehydrate();
      const pendingState = {
        providers: {},
        activeProviderId: null,
        _hasHydrated: false,
      };
      useProviderStore.setState(pendingState);
      const originalStorage = useProviderStore.persist.getOptions().storage;
      const provider = makeProvider('saved', 'Saved provider');
      const persistedState = {
        providers: hasSavedProvider ? { saved: provider } : {},
        activeProviderId: hasSavedProvider ? 'saved' : null,
        validationStatus: {},
      };
      let finishRead!: (value: {
        state: typeof persistedState;
        version: number;
      }) => void;
      const storage = {
        getItem: () =>
          new Promise<{ state: typeof persistedState; version: number }>(
            (resolve) => {
              finishRead = resolve;
            }
          ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      useProviderStore.persist.setOptions({ storage });
      const hydration = useProviderStore.persist.rehydrate();
      render(<ProvidersSettingsPage />);

      try {
        expect(screen.queryByText(/no provider yet/i)).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /set up a provider/i })
        ).not.toBeInTheDocument();
        expect(screen.getByText('Loading providers...')).toBeInTheDocument();
      } finally {
        await act(async () => {
          finishRead({ state: persistedState, version: 1 });
          await hydration;
        });
        useProviderStore.persist.setOptions({ storage: originalStorage });
      }

      expect(
        screen.queryByText('Loading providers...')
      ).not.toBeInTheDocument();
      if (hasSavedProvider) {
        expect(screen.getByText('Saved provider')).toBeInTheDocument();
        expect(screen.queryByText(/no provider yet/i)).not.toBeInTheDocument();
      } else {
        expect(screen.getByText(/no provider yet/i)).toBeInTheDocument();
      }
      expect(storage.setItem).toHaveBeenCalledWith('narraitor-provider-store', {
        state: persistedState,
        version: 1,
      });
    }
  );

  test('settles the loading state when storage cannot be read', async () => {
    await useProviderStore.persist.rehydrate();
    useProviderStore.setState({
      providers: {},
      activeProviderId: null,
      _hasHydrated: false,
    });
    const originalStorage = useProviderStore.persist.getOptions().storage;
    useProviderStore.persist.setOptions({
      storage: {
        getItem: async () => {
          throw new Error('Storage unavailable');
        },
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });
    try {
      const hydration = useProviderStore.persist.rehydrate();
      render(<ProvidersSettingsPage />);
      expect(screen.getByText('Loading providers...')).toBeInTheDocument();
      await act(async () => {
        await hydration;
      });
      expect(
        screen.queryByText('Loading providers...')
      ).not.toBeInTheDocument();
      expect(screen.getByText(/no provider yet/i)).toBeInTheDocument();
    } finally {
      useProviderStore.persist.setOptions({ storage: originalStorage });
    }
  });
});
