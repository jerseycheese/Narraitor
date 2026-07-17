'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';

type PersistApi = {
  persist?: {
    hasHydrated?: () => boolean;
    onFinishHydration?: (callback: () => void) => () => void;
  };
};

const getPersist = (store: unknown): PersistApi['persist'] =>
  (store as PersistApi).persist;

const hasLocalAppState = (): boolean => {
  const { worlds } = useWorldStore.getState();
  const { characters } = useCharacterStore.getState();
  const { savedSessions } = useSessionStore.getState();
  return (
    Object.keys(worlds).length > 0 ||
    Object.keys(characters).length > 0 ||
    Object.keys(savedSessions).length > 0
  );
};

/**
 * ReturningUserRedirect - routes returning browsers from the public landing
 * page (/) to /dashboard (#1528).
 *
 * "Returning" is local-first: this browser has persisted worlds, characters,
 * or saved sessions. The stores hydrate asynchronously from IndexedDB, so the
 * check waits for the persist middleware to finish (same pattern as
 * src/app/play/page.tsx) instead of reading pre-hydration state. The decision
 * runs once per mount - data seeded after arrival doesn't yank the page.
 *
 * Renders nothing; the server-rendered Landing stays visible (no blank-out,
 * no layout shift) and anonymous visitors never navigate.
 */
export function ReturningUserRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectIfReturning = () => {
      if (hasLocalAppState()) {
        router.replace('/dashboard');
      }
    };

    const persists = [
      getPersist(useWorldStore),
      getPersist(useCharacterStore),
      getPersist(useSessionStore),
    ];

    if (persists.every((p) => p?.hasHydrated?.() ?? true)) {
      redirectIfReturning();
      return;
    }

    let pending = persists.filter(
      (p) => p?.hasHydrated && !p.hasHydrated()
    ).length;
    const unsubscribes: Array<() => void> = [];

    persists.forEach((p) => {
      if (p?.onFinishHydration && p.hasHydrated && !p.hasHydrated()) {
        const unsub = p.onFinishHydration(() => {
          pending -= 1;
          if (pending <= 0) redirectIfReturning();
        });
        unsubscribes.push(unsub);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [router]);

  return null;
}
