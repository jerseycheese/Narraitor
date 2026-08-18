/**
 * Side-effect module that wires cross-store event subscriptions.
 *
 * sessionStore is a leaf in the store import graph: it emits events instead
 * of importing sibling stores. The subscribers live either in the stores
 * themselves (narrativeStore/inventoryStore self-subscribe at module tail,
 * forced to register by the imports below) or in one-way lib modules
 * (session journal entries, which read journal/world/character/narrative
 * stores and so can't live on any one of them without re-creating a cycle).
 *
 * Imported once from SessionRecoveryManager, which mounts in the root
 * layout — so the wiring is live on every route before any session
 * initializes or ends. Jest suites that assert session-boundary side effects
 * import this module directly.
 */
import './narrativeStore';
import './inventoryStore';
// World-deletion cascade subscribers (WORLD_DELETED at each module tail).
// Imported here so the cleanup is registered on every route — a world can be
// deleted from a page that never renders NPCs, goals, or lore.
import './npcStore';
import './goalStore';
import './worldThreadStore';
import './loreStore';
import {
  storeEvents,
  StoreEventTypes,
  type SessionStartedEvent,
  type SessionEndedEvent,
} from '@/lib/state/storePubSub';
import { handleSessionStarted, handleSessionEnded } from '@/lib/session/sessionJournalEntries';

// subscribeOnce (keyed, deduped per bus instance) so a re-evaluated module —
// HMR in dev, or this side-effect import being pulled in more than once —
// can't stack duplicate journal handlers and write a session_start/end entry
// twice. The store-tail subscriptions in narrativeStore/inventoryStore stay on
// plain subscribe: their handlers only clear data, so a double-fire is a no-op.
storeEvents.subscribeOnce<SessionStartedEvent>(
  StoreEventTypes.SESSION_STARTED,
  handleSessionStarted,
  'session-journal:started'
);
storeEvents.subscribeOnce<SessionEndedEvent>(
  StoreEventTypes.SESSION_ENDED,
  handleSessionEnded,
  'session-journal:ended'
);
