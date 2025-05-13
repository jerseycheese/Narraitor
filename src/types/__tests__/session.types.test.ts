// src/types/__tests__/session.types.test.ts
import { 
  GameSession, 
  SessionState,
  NarrativeContext 
} from '../session.types';

describe('Session Types', () => {
  describe('GameSession interface', () => {
    test('should create a valid game session', () => {
      const session: GameSession = {
        id: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        state: {
          status: 'active',
          lastActivity: '2025-01-13T10:00:00Z',
          savePoint: {
            narrativeSegmentId: 'seg-5',
            timestamp: '2025-01-13T09:30:00Z',
            description: 'Arrived at town'
          }
        },
        narrativeHistory: ['seg-1', 'seg-2', 'seg-3', 'seg-4', 'seg-5'],
        currentContext: {
          recentSegments: ['seg-3', 'seg-4', 'seg-5'],
          activeCharacters: ['char-1', 'char-npc-1'],
          currentLocation: 'Town Square',
          activeQuests: ['find-the-sheriff'],
          mood: 'tense'
        },
        createdAt: '2025-01-13T08:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(session.state.status).toBe('active');
      expect(session.currentContext.recentSegments).toHaveLength(3);
      expect(session.narrativeHistory).toHaveLength(5);
    });

    test('should support different session states', () => {
      const states: Array<SessionState['status']> = ['active', 'paused', 'completed'];
      
      states.forEach(status => {
        const state: SessionState = {
          status,
          lastActivity: '2025-01-13T10:00:00Z'
        };
        expect(state.status).toBe(status);
      });
    });
  });

  describe('NarrativeContext interface', () => {
    test('should create context with optional fields', () => {
      const minimalContext: NarrativeContext = {
        recentSegments: ['seg-1'],
        activeCharacters: ['char-1']
      };

      expect(minimalContext.currentLocation).toBeUndefined();
      expect(minimalContext.activeQuests).toBeUndefined();
      expect(minimalContext.mood).toBeUndefined();
    });
  });
});
