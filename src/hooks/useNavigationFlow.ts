import { usePathname } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';

export interface NextStep {
  label: string;
  href: string;
  action: 'select-world' | 'create-world' | 'select-character' | 'create-character' | 'start-game';
  isEnabled: boolean;
  characterId?: string;
}

export interface QuickStartInfo {
  sessionId: string;
  worldName: string;
  characterName: string;
  narrativeCount: number;
  lastPlayed: string;
}

export type FlowStep = 'world' | 'character' | 'ready' | 'playing';

export function useNavigationFlow() {
  const pathname = usePathname();
  const { currentWorldId, worlds } = worldStore();
  const { characters } = characterStore();
  const { savedSessions } = sessionStore();

  const getNextStep = (): NextStep | null => {
    // Already playing
    if (pathname === '/play') {
      return null;
    }

    // No world selected yet
    if (!currentWorldId) {
      if (Object.keys(worlds).length === 0) {
        return {
          label: 'Create Your First World',
          href: '/world/create',
          action: 'create-world',
          isEnabled: true,
        };
      }
      return {
        label: 'Select a World',
        href: '/worlds',
        action: 'select-world',
        isEnabled: true,
      };
    }

    // World selected, check for characters
    const worldCharacters = Object.values(characters).filter(
      char => char.worldId === currentWorldId
    );

    // On character detail page - ready to play
    if (pathname.startsWith('/characters/') && pathname !== '/characters/create') {
      const characterId = pathname.split('/').pop();
      return {
        label: 'Start Playing',
        href: '/play',
        action: 'start-game',
        isEnabled: true,
        characterId,
      };
    }

    // No characters for this world yet
    if (worldCharacters.length === 0) {
      return {
        label: 'Create a Character',
        href: '/characters/create',
        action: 'create-character',
        isEnabled: true,
      };
    }

    // Characters exist but none selected
    return {
      label: 'Select a Character',
      href: '/characters',
      action: 'select-character',
      isEnabled: true,
    };
  };

  const canQuickStart = (): boolean => {
    const sessions = Object.values(savedSessions);
    
    // Find any valid saved session
    return sessions.some(session => {
      const world = worlds[session.worldId];
      const character = characters[session.characterId];
      return world && character;
    });
  };

  const getQuickStartInfo = (): QuickStartInfo | null => {
    const sessions = Object.values(savedSessions);
    
    // Find the most recent valid session
    const validSessions = sessions
      .filter(session => {
        const world = worlds[session.worldId];
        const character = characters[session.characterId];
        return world && character;
      })
      .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());

    if (validSessions.length === 0) {
      return null;
    }

    const mostRecent = validSessions[0];
    const world = worlds[mostRecent.worldId];
    const character = characters[mostRecent.characterId];

    return {
      sessionId: mostRecent.id,
      worldName: world.name,
      characterName: character.name,
      narrativeCount: mostRecent.narrativeCount,
      lastPlayed: mostRecent.lastPlayed,
    };
  };

  const getCurrentFlowStep = (): FlowStep => {
    if (pathname === '/play') {
      return 'playing';
    }

    if (!currentWorldId || pathname === '/worlds' || pathname === '/world/create') {
      return 'world';
    }

    const hasCharacterSelected = pathname.startsWith('/characters/') && pathname !== '/characters/create';
    if (hasCharacterSelected) {
      return 'ready';
    }

    return 'character';
  };

  return {
    getNextStep,
    canQuickStart,
    getQuickStartInfo,
    getCurrentFlowStep,
  };
}
