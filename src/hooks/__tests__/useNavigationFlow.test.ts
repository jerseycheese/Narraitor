import { renderHook } from '@testing-library/react';
import { useNavigationFlow } from '../useNavigationFlow';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { usePathname } from 'next/navigation';

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/sessionStore');
jest.mock('next/navigation');

describe('useNavigationFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNextStep', () => {
    it('should return world creation when no worlds exist', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: null,
        worlds: {},
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toEqual({
        label: 'Create Your First World',
        href: '/world/create',
        action: 'create-world',
        isEnabled: true,
      });
    });

    it('should return world selection when worlds exist but none selected', () => {
      (usePathname as jest.Mock).mockReturnValue('/worlds');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: null,
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toEqual({
        label: 'Select a World',
        href: '/worlds',
        action: 'select-world',
        isEnabled: true,
      });
    });

    it('should return character selection when world is selected but no character', () => {
      (usePathname as jest.Mock).mockReturnValue('/world/world-1');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toEqual({
        label: 'Create a Character',
        href: '/characters/create',
        action: 'create-character',
        isEnabled: true,
      });
    });

    it('should return character selection when characters exist for world', () => {
      (usePathname as jest.Mock).mockReturnValue('/world/world-1');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toEqual({
        label: 'Select a Character',
        href: '/characters',
        action: 'select-character',
        isEnabled: true,
      });
    });

    it('should return start playing when on character page', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters/char-1');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toEqual({
        label: 'Start Playing',
        href: '/play',
        action: 'start-game',
        isEnabled: true,
        characterId: 'char-1',
      });
    });

    it('should return null when already playing', () => {
      (usePathname as jest.Mock).mockReturnValue('/play');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getNextStep()).toBeNull();
    });
  });

  describe('canQuickStart', () => {
    it('should return true when saved session exists', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'world-1',
            characterId: 'char-1',
            lastPlayed: new Date().toISOString(),
          },
        },
      });
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Test Character' },
        },
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.canQuickStart()).toBe(true);
    });

    it('should return false when no saved sessions', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.canQuickStart()).toBe(false);
    });

    it('should return false when saved session references deleted world', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'deleted-world',
            characterId: 'char-1',
          },
        },
      });
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.canQuickStart()).toBe(false);
    });
  });

  describe('getQuickStartInfo', () => {
    it('should return most recent valid session info', () => {
      const recentSession = {
        id: 'session-2',
        worldId: 'world-1',
        characterId: 'char-1',
        lastPlayed: new Date().toISOString(),
        narrativeCount: 10,
      };
      const olderSession = {
        id: 'session-1',
        worldId: 'world-2',
        characterId: 'char-2',
        lastPlayed: new Date(Date.now() - 86400000).toISOString(),
        narrativeCount: 5,
      };

      (usePathname as jest.Mock).mockReturnValue('/');
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {
          'session-1': olderSession,
          'session-2': recentSession,
        },
      });
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        worlds: {
          'world-1': { id: 'world-1', name: 'Test World 1' },
          'world-2': { id: 'world-2', name: 'Test World 2' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1', name: 'Character 1' },
          'char-2': { id: 'char-2', worldId: 'world-2', name: 'Character 2' },
        },
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getQuickStartInfo()).toEqual({
        sessionId: 'session-2',
        worldName: 'Test World 1',
        characterName: 'Character 1',
        narrativeCount: 10,
        lastPlayed: recentSession.lastPlayed,
      });
    });

    it('should return null when no valid sessions', () => {
      (usePathname as jest.Mock).mockReturnValue('/');
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getQuickStartInfo()).toBeNull();
    });
  });

  describe('getCurrentFlowStep', () => {
    it('should return world when on world selection', () => {
      (usePathname as jest.Mock).mockReturnValue('/worlds');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: null,
        worlds: {},
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getCurrentFlowStep()).toBe('world');
    });

    it('should return character when on character selection', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1' },
        },
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getCurrentFlowStep()).toBe('character');
    });

    it('should return ready when character is selected', () => {
      (usePathname as jest.Mock).mockReturnValue('/characters/char-1');
      (useWorldStore as unknown as jest.Mock).mockReturnValue({
        currentWorldId: 'world-1',
        worlds: {
          'world-1': { id: 'world-1' },
        },
      });
      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-1': { id: 'char-1', worldId: 'world-1' },
        },
      });

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getCurrentFlowStep()).toBe('ready');
    });

    it('should return playing when on play page', () => {
      (usePathname as jest.Mock).mockReturnValue('/play');

      const { result } = renderHook(() => useNavigationFlow());

      expect(result.current.getCurrentFlowStep()).toBe('playing');
    });
  });
});
