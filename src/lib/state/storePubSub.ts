import Logger from '@/lib/utils/logger';

const logger = new Logger('StorePubSub');

/**
 * Pub-Sub Event System for Store Communication
 *
 * Used for cascade-delete handoffs between stores that would otherwise need
 * circular imports (e.g. characterStore imports worldStore, but worldStore
 * needs to notify characterStore when a world is deleted).
 */

type EventCallback<T = unknown> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

class StoreEventBus {
  private subscribers = new Map<string, Set<EventCallback>>();
  // Keys of subscriptions registered via subscribeOnce, so repeat calls with
  // the same key (HMR re-evaluation, a stray double import) don't stack
  // duplicate handlers. Tracked per bus instance — NOT on a module global or
  // globalThis — so a fresh bus (jest resets modules per test file) starts
  // with an empty set and re-registers correctly, while a re-evaluated wiring
  // module hitting the same live bus is deduped.
  private onceKeys = new Set<string>();

  subscribe<T = unknown>(event: string, callback: EventCallback<T>): EventSubscription {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback as EventCallback);

    return {
      unsubscribe: () => {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
          callbacks.delete(callback as EventCallback);
          if (callbacks.size === 0) {
            this.subscribers.delete(event);
          }
        }
      },
    };
  }

  /**
   * Idempotent subscribe: registers the callback only the first time this
   * `key` is seen on this bus instance. Use for app-lifetime wiring that may
   * be evaluated more than once (HMR, re-imported side-effect modules), where
   * a duplicate handler would be harmful — e.g. writing a session journal
   * entry twice. Returns a no-op subscription on repeat calls.
   */
  subscribeOnce<T = unknown>(
    event: string,
    callback: EventCallback<T>,
    key: string
  ): EventSubscription {
    if (this.onceKeys.has(key)) {
      return { unsubscribe: () => {} };
    }
    this.onceKeys.add(key);

    const subscription = this.subscribe(event, callback);
    return {
      unsubscribe: () => {
        this.onceKeys.delete(key);
        subscription.unsubscribe();
      },
    };
  }

  async emit<T = unknown>(event: string, data: T): Promise<void> {
    const callbacks = this.subscribers.get(event);
    if (!callbacks) return;

    await Promise.all(
      Array.from(callbacks).map(async (callback) => {
        try {
          await callback(data);
        } catch (error) {
          logger.error(`Error in event handler for "${event}":`, error);
        }
      })
    );
  }
}

export const storeEvents = new StoreEventBus();

export const StoreEventTypes = {
  CHARACTER_DELETED: 'character:deleted',
  WORLD_DELETED: 'world:deleted',
  SESSION_FRESH_START: 'session:fresh-start',
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
} as const;

export interface CharacterDeletedEvent {
  characterId: string;
}

export interface WorldDeletedEvent {
  worldId: string;
}

/**
 * Emitted by sessionStore.initializeSession before a fresh/new session
 * activates, so sibling stores can reset their per-session data.
 * narrativeStore clears segments/decisions when isNewSession; inventoryStore
 * clears the character inventory when isForcedFresh.
 */
export interface SessionFreshStartEvent {
  sessionId: string;
  worldId: string;
  characterId: string;
  isNewSession: boolean;
  isForcedFresh: boolean;
}

/** Emitted after a session activates; drives the session-start journal entry. */
export interface SessionStartedEvent {
  sessionId: string;
  worldId: string;
  characterId: string;
  startedAt: string;
}

/** Emitted while endSession still holds the session identity; drives the session-end journal entry. */
export interface SessionEndedEvent {
  sessionId: string;
  worldId: string;
  characterId: string;
  endedAt: string;
}
