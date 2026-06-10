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
import {
  storeEvents,
  StoreEventTypes,
  type SessionStartedEvent,
  type SessionEndedEvent,
} from '@/lib/state/storePubSub';
import { handleSessionStarted, handleSessionEnded } from '@/lib/session/sessionJournalEntries';

storeEvents.subscribe<SessionStartedEvent>(StoreEventTypes.SESSION_STARTED, handleSessionStarted);
storeEvents.subscribe<SessionEndedEvent>(StoreEventTypes.SESSION_ENDED, handleSessionEnded);
