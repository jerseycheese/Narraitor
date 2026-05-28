'use client';

import React from 'react';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { GameSessionRecoveryPrompt } from './GameSessionRecoveryPrompt';

/**
 * Watches for a session that ended abnormally and surfaces the recovery prompt
 * anywhere in the app, since a crash can drop the player on any page (issue #221).
 * Mounted once at the app shell level.
 */
export function SessionRecoveryManager() {
  const { recovery, restore, dismiss } = useSessionRecovery();

  const worldName = useWorldStore((state) =>
    recovery ? state.worlds[recovery.worldId]?.name : undefined
  );
  const characterName = useCharacterStore((state) =>
    recovery ? state.characters[recovery.characterId]?.name : undefined
  );

  if (!recovery) {
    return null;
  }

  return (
    <GameSessionRecoveryPrompt
      isOpen
      worldName={worldName ?? 'your world'}
      characterName={characterName ?? 'your character'}
      lastActivity={recovery.lastActivity}
      narrativeCount={recovery.narrativeCount}
      onRestore={restore}
      onDismiss={dismiss}
    />
  );
}
