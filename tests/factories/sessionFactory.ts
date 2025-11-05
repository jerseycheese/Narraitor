import { Factory } from 'fishery';
import type { GameSessionFixture } from '../fixtures/sessions.fixture';

/**
 * Factory for generating GameSession test data
 *
 * Usage:
 * ```typescript
 * // Generate a default session
 * const session = sessionFactory.build();
 *
 * // Override specific properties
 * const activeSession = sessionFactory.build({
 *   status: 'active',
 *   worldId: 'world-123',
 *   characterId: 'char-456'
 * });
 *
 * // Generate multiple sessions
 * const sessions = sessionFactory.buildList(5);
 * ```
 */
export const sessionFactory = Factory.define<GameSessionFixture>(({ sequence }) => ({
  id: `session-${sequence}`,
  worldId: `world-${sequence}`,
  characterId: `char-${sequence}`,
  name: `Test Session ${sequence}`,
  status: 'active',
  currentTurn: 1,
  totalTurns: 1,
  lastPlayedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
