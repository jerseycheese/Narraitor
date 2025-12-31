/**
 * Test fixture data for Game Session entities
 * Used in visual regression tests and integration tests
 */

export interface GameSessionFixture {
  id: string;
  worldId: string;
  characterId: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  currentTurn: number;
  totalTurns: number;
  lastPlayedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const SAMPLE_GAME_SESSIONS: GameSessionFixture[] = [
  {
    id: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    name: 'The Data Heist',
    status: 'active' as const,
    currentTurn: 3,
    totalTurns: 3,
    lastPlayedAt: '2024-01-01T02:00:00.000Z',
    createdAt: '2024-01-01T02:00:00.000Z',
    updatedAt: '2024-01-01T02:00:00.000Z',
  },
  {
    id: 'session-fantasy-mage',
    worldId: 'world-fantasy-realm',
    characterId: 'char-fantasy-mage',
    name: "The Dragon's Library",
    status: 'active' as const,
    currentTurn: 2,
    totalTurns: 2,
    lastPlayedAt: '2024-01-02T02:00:00.000Z',
    createdAt: '2024-01-02T02:00:00.000Z',
    updatedAt: '2024-01-02T02:00:00.000Z',
  },
];
