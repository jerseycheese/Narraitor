/**
 * Per-state seed builder for the cross-theme audit (#1129).
 *
 * Emits a JSON map of `{ "<persist-key>": "<json-string>" }` that downstream
 * crawl scripts inject into IndexedDB + localStorage via `bdg dom eval`.
 *
 * States:
 *   empty        — no worlds, no characters, no sessions; tutorialProgress all false
 *   seeded       — SAMPLE_WORLDS + SAMPLE_CHARACTERS + SAMPLE_GAME_SESSIONS, no active session
 *   mid-session  — seeded + currentSessionId set + segments + decisions + journal entries
 *
 * Usage:
 *   npx tsx scripts/audit/build-seed.ts --state empty       > scripts/audit/seeds/empty.json
 *   npx tsx scripts/audit/build-seed.ts --state seeded      > scripts/audit/seeds/seeded.json
 *   npx tsx scripts/audit/build-seed.ts --state mid-session > scripts/audit/seeds/mid-session.json
 *
 * Persist versions are read from src/state/<store>.ts and must be kept in sync
 * if any store bumps its persist version.
 */
import {
  SAMPLE_WORLDS,
  SAMPLE_CHARACTERS,
  SAMPLE_GAME_SESSIONS,
  SAMPLE_NARRATIVE_SEGMENTS,
  SAMPLE_DECISIONS,
  SAMPLE_JOURNAL_ENTRIES,
} from '../../tests/fixtures';

type State = 'empty' | 'seeded' | 'mid-session';

const VERSIONS = {
  world: 5,
  character: 3,
  session: 4,
  narrative: 1,
  journal: 1,
  npc: 2,
} as const;

const PHASES_DONE = {
  intro: { completed: true, skipped: false },
  worldCreation: { completed: true, skipped: false, lastStep: 999 },
  worldGeneration: { completed: true, skipped: false, lastStep: 0 },
  characterCreation: { completed: true, skipped: false, lastStep: 5 },
  firstPlay: { completed: true, skipped: false },
};

const PHASES_EMPTY = {
  intro: { completed: false, skipped: false },
  worldCreation: { completed: false, skipped: false, lastStep: 0 },
  worldGeneration: { completed: false, skipped: false, lastStep: 0 },
  characterCreation: { completed: false, skipped: false, lastStep: 0 },
  firstPlay: { completed: false, skipped: false },
};

function byId<T extends { id: string }>(arr: readonly T[]): Record<string, T> {
  return Object.fromEntries(arr.map((x) => [x.id, x]));
}

function buildSeed(state: State): Record<string, string> {
  const isEmpty = state === 'empty';
  const isMid = state === 'mid-session';

  const worlds = isEmpty ? {} : byId(SAMPLE_WORLDS);
  const characters = isEmpty ? {} : byId(SAMPLE_CHARACTERS);
  const sessions = isEmpty ? {} : byId(SAMPLE_GAME_SESSIONS);
  const firstSession = isEmpty ? null : SAMPLE_GAME_SESSIONS[0];

  const segments = isMid ? byId(SAMPLE_NARRATIVE_SEGMENTS) : {};
  const decisions = isMid ? byId(SAMPLE_DECISIONS) : {};
  const journalEntries = isMid ? byId(SAMPLE_JOURNAL_ENTRIES) : {};

  const sessionSegments: Record<string, string[]> = {};
  const sessionDecisions: Record<string, string[]> = {};
  const sessionJournal: Record<string, string[]> = {};
  if (isMid && firstSession) {
    sessionSegments[firstSession.id] = Object.keys(segments).filter(
      (id) => (segments as Record<string, { sessionId?: string }>)[id]?.sessionId === firstSession.id,
    );
    sessionDecisions[firstSession.id] = Object.keys(decisions);
    sessionJournal[firstSession.id] = Object.keys(journalEntries);
  }

  const savedSessions = isEmpty
    ? {}
    : SAMPLE_GAME_SESSIONS.reduce<Record<string, unknown>>((acc, s) => {
        acc[s.id] = {
          id: s.id,
          worldId: s.worldId,
          characterId: s.characterId,
          lastPlayed: (s as { lastPlayedAt?: string }).lastPlayedAt ?? null,
          narrativeCount: (s as { totalTurns?: number }).totalTurns ?? 0,
        };
        return acc;
      }, {});

  const stores = {
    world: {
      state: {
        worlds,
        currentWorldId: isEmpty ? null : SAMPLE_WORLDS[0]?.id ?? null,
        error: null,
        loading: false,
      },
      version: VERSIONS.world,
    },
    character: {
      state: {
        characters,
        currentCharacterId: isEmpty ? null : SAMPLE_CHARACTERS[0]?.id ?? null,
        error: null,
        loading: false,
      },
      version: VERSIONS.character,
    },
    session: {
      state: {
        sessions,
        currentSessionId: isMid && firstSession ? firstSession.id : null,
        id: isMid && firstSession ? firstSession.id : null,
        status: isMid ? ('active' as const) : ('idle' as const),
        worldId: isMid && firstSession ? firstSession.worldId : null,
        characterId: isMid && firstSession ? firstSession.characterId : null,
        savedSessions,
        tutorialProgress: {
          phases: isEmpty ? PHASES_EMPTY : PHASES_DONE,
          dismissedHints: [],
          lastActiveStep: null,
        },
        error: null,
        loading: false,
      },
      version: VERSIONS.session,
    },
    narrative: {
      state: {
        segments,
        sessionSegments,
        decisions,
        sessionDecisions,
        endedSessions: {},
        currentEnding: null,
        isGeneratingEnding: false,
        endingError: null,
        error: null,
        loading: false,
      },
      version: VERSIONS.narrative,
    },
    journal: {
      state: {
        entries: journalEntries,
        sessionEntries: sessionJournal,
      },
      version: VERSIONS.journal,
    },
    npc: {
      state: { npcs: {}, error: null, loading: false },
      version: VERSIONS.npc,
    },
  } as const;

  return {
    'narraitor-world-store': JSON.stringify(stores.world),
    'narraitor-character-store': JSON.stringify(stores.character),
    'narraitor-session-store': JSON.stringify(stores.session),
    'narraitor-narrative-store': JSON.stringify(stores.narrative),
    'narraitor-journal-store': JSON.stringify(stores.journal),
    'narraitor-npc-store': JSON.stringify(stores.npc),
  };
}

function parseStateArg(): State {
  const idx = process.argv.indexOf('--state');
  const value = idx >= 0 ? process.argv[idx + 1] : 'seeded';
  if (value !== 'empty' && value !== 'seeded' && value !== 'mid-session') {
    console.error(`Invalid --state '${value}'. Expected: empty | seeded | mid-session`);
    process.exit(1);
  }
  return value;
}

const state = parseStateArg();
process.stdout.write(JSON.stringify(buildSeed(state), null, 2));
