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

export class StoreEventBus {
  private subscribers = new Map<string, Set<EventCallback>>();

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
} as const;

export interface CharacterDeletedEvent {
  characterId: string;
}

export interface WorldDeletedEvent {
  worldId: string;
}
