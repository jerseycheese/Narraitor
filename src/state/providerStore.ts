// src/state/providerStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUniqueId, getTimestamp } from '@/lib/utils';
import { createProviderStorage } from '@/lib/storage/providerStorage';
import {
  clearEncryptionKey,
  decryptSecret,
  encryptSecret,
  type EncryptedPayload,
} from '@/lib/storage/encryption';
import { validateProviderKey } from '@/lib/ai/validateProviderClient';
import type {
  ProviderConfig,
  ProviderType,
  ProviderValidationRecord,
} from '@/types/provider.types';

const STORE_NAME = 'narraitor-provider-store';

/**
 * Input for saving a provider. The plaintext key comes in here and is encrypted
 * by the store before anything is persisted — callers (the UI) never touch
 * encryption directly, and the plaintext is gone once the action returns.
 */
export type AddProviderInput = Omit<
  ProviderConfig,
  'id' | 'createdAt' | 'updatedAt' | 'encryptedApiKey'
> & {
  /** Plaintext API key; omitted for keyless providers (e.g. local Ollama). */
  apiKey?: string;
};

export interface ProviderStore {
  providers: Record<string, ProviderConfig>;
  activeProviderId: string | null;
  validationStatus: Record<string, ProviderValidationRecord>;
  error: string | null;
  loading: boolean;

  addProvider: (input: AddProviderInput) => Promise<string>;
  updateProvider: (
    id: string,
    updates: Partial<AddProviderInput>
  ) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => void;
  validateProvider: (id: string) => Promise<boolean>;
  /** Wipe every provider and the encryption key — leaves no trace. */
  forgetAllProviders: () => Promise<void>;
  reset: () => void;
}

async function encryptKey(apiKey: string): Promise<string> {
  const payload = await encryptSecret(apiKey);
  return JSON.stringify(payload);
}

async function decryptKey(encryptedApiKey: string): Promise<string | null> {
  try {
    const payload = JSON.parse(encryptedApiKey) as EncryptedPayload;
    return await decryptSecret(payload);
  } catch {
    return null;
  }
}

const INITIAL_STATE = {
  providers: {} as Record<string, ProviderConfig>,
  activeProviderId: null as string | null,
  validationStatus: {} as Record<string, ProviderValidationRecord>,
  error: null as string | null,
  loading: false,
};

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addProvider: async (input) => {
        const id = generateUniqueId('provider');
        const now = getTimestamp();
        const { apiKey, ...rest } = input;
        const encryptedApiKey = apiKey ? await encryptKey(apiKey) : undefined;

        const config: ProviderConfig = {
          ...rest,
          id,
          encryptedApiKey,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          providers: { ...state.providers, [id]: config },
          // First provider becomes active automatically.
          activeProviderId: state.activeProviderId ?? id,
          error: null,
        }));

        return id;
      },

      updateProvider: async (id, updates) => {
        const existing = get().providers[id];
        if (!existing) {
          set({ error: 'Provider not found' });
          return;
        }

        const { apiKey, ...rest } = updates;
        const encryptedApiKey =
          apiKey !== undefined
            ? apiKey
              ? await encryptKey(apiKey)
              : undefined
            : existing.encryptedApiKey;

        const updated: ProviderConfig = {
          ...existing,
          ...rest,
          encryptedApiKey,
          updatedAt: getTimestamp(),
        };

        set((state) => ({
          providers: { ...state.providers, [id]: updated },
          // A changed config can no longer be assumed valid.
          validationStatus: omitKey(state.validationStatus, id),
          error: null,
        }));
      },

      removeProvider: async (id) => {
        const remaining = omitKey(get().providers, id);
        const remainingIds = Object.keys(remaining);
        const wasActive = get().activeProviderId === id;

        set((state) => ({
          providers: remaining,
          validationStatus: omitKey(state.validationStatus, id),
          activeProviderId: wasActive
            ? remainingIds[0] ?? null
            : state.activeProviderId,
        }));

        // No encrypted data left — drop the master key too.
        if (remainingIds.length === 0) {
          await clearEncryptionKey();
        }
      },

      setActiveProvider: (id) => {
        if (!get().providers[id]) return;
        set({ activeProviderId: id });
      },

      validateProvider: async (id) => {
        const config = get().providers[id];
        if (!config) return false;

        const key = config.encryptedApiKey
          ? await decryptKey(config.encryptedApiKey)
          : null;

        try {
          const data = await validateProviderKey({
            apiKey: key,
            type: config.type,
            endpoint: config.endpoint,
            model: config.model,
            checkImage: config.capabilities.images,
          });
          const valid = Boolean(data.valid);

          set((state) => ({
            validationStatus: {
              ...state.validationStatus,
              [id]: { valid, lastChecked: getEpochMs(), error: data.error },
            },
          }));

          return valid;
        } catch {
          set((state) => ({
            validationStatus: {
              ...state.validationStatus,
              [id]: { valid: false, lastChecked: getEpochMs(), error: 'NETWORK' },
            },
          }));
          return false;
        }
      },

      forgetAllProviders: async () => {
        set({ ...INITIAL_STATE });
        await clearEncryptionKey();
      },

      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: STORE_NAME,
      storage: createProviderStorage(),
      version: 1,
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
        validationStatus: state.validationStatus,
      }),
    }
  )
);

function omitKey<T>(record: Record<string, T>, id: string): Record<string, T> {
  const next = { ...record };
  delete next[id];
  return next;
}

function getEpochMs(): number {
  return new Date(getTimestamp()).getTime();
}

/**
 * Just-in-time decrypt the active provider's API key.
 *
 * Returns the plaintext key for the caller (the provider factory / aiFetch) to
 * use immediately and discard. The plaintext is never written back into the
 * store, React state, or any global — it only lives in this closure's return
 * value until the caller drops it.
 */
export async function getActiveProviderKey(): Promise<string | null> {
  const { providers, activeProviderId } = useProviderStore.getState();
  if (!activeProviderId) return null;

  const config = providers[activeProviderId];
  if (!config?.encryptedApiKey) return null;

  return decryptKey(config.encryptedApiKey);
}

/**
 * The model the active provider is configured to run on, or null when there is
 * no provider or it never got one. Null means "use the server's default", which
 * is what every session before provider configuration existed still does.
 */
export function getActiveProviderModel(): string | null {
  const { providers, activeProviderId } = useProviderStore.getState();
  if (!activeProviderId) return null;

  return providers[activeProviderId]?.model?.trim() || null;
}

/**
 * What kind of provider is active and where it lives, for `aiFetch` to send
 * alongside the key. Null when nothing is configured, which keeps the request
 * header-free and the server on its Gemini default.
 *
 * Deliberately excludes the key: that is decrypted separately and on demand by
 * `getActiveProviderKey`, so the plaintext never travels with the metadata.
 */
export function getActiveProviderRouting(): { type: ProviderType; endpoint: string } | null {
  const { providers, activeProviderId } = useProviderStore.getState();
  if (!activeProviderId) return null;

  const config = providers[activeProviderId];
  if (!config) return null;

  return { type: config.type, endpoint: config.endpoint?.trim() ?? '' };
}
