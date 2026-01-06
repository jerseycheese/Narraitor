/**
 * Pub-Sub Event System for Store Communication
 *
 * Provides a type-safe event-based communication pattern to break circular
 * dependencies between Zustand stores. Instead of stores directly importing
 * each other, they emit and listen to events.
 */

type EventCallback<T = unknown> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Store event emitter for decoupled store communication
 */
export class StoreEventBus {
  private subscribers = new Map<string, Set<EventCallback>>();

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param callback - Function to call when event is emitted
   * @returns Subscription object with unsubscribe method
   */
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
   * Emit an event to all subscribers
   * @param event - Event name
   * @param data - Event payload
   */
  async emit<T = unknown>(event: string, data: T): Promise<void> {
    const callbacks = this.subscribers.get(event);
    if (!callbacks) return;

    await Promise.all(
      Array.from(callbacks).map(async (callback) => {
        try {
          await callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      })
    );
  }

  /**
   * Remove all subscribers for an event
   * @param event - Event name
   */
  clear(event: string): void {
    this.subscribers.delete(event);
  }

  /**
   * Remove all subscribers for all events
   */
  clearAll(): void {
    this.subscribers.clear();
  }
}

/**
 * Global store event bus instance
 * Used for communication between stores without direct imports
 */
export const storeEvents = new StoreEventBus();

/**
 * Store event types for type-safe event handling
 */
export const StoreEventTypes = {
  // Character events
  CHARACTER_DELETED: 'character:deleted',
  CHARACTER_CREATED: 'character:created',
  CHARACTER_UPDATED: 'character:updated',
  CHARACTER_ATTRIBUTE_CHANGED: 'character:attribute:changed',

  // World events
  WORLD_DELETED: 'world:deleted',
  WORLD_CREATED: 'world:created',
  WORLD_UPDATED: 'world:updated',

  // Session events
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
  SESSION_DELETED: 'session:deleted',

  // Inventory events
  INVENTORY_CLEARED: 'inventory:cleared',
  ITEM_ADDED: 'inventory:item:added',
  ITEM_REMOVED: 'inventory:item:removed',

  // Goal events
  GOAL_COMPLETED: 'goal:completed',
  GOAL_CREATED: 'goal:created',
} as const;

/**
 * Event payload types
 */
export interface CharacterDeletedEvent {
  characterId: string;
}

export interface CharacterAttributeChangedEvent {
  characterId: string;
  worldId: string;
}

export interface WorldDeletedEvent {
  worldId: string;
}

export interface SessionDeletedEvent {
  sessionId: string;
}

export interface InventoryClearedEvent {
  characterId: string;
}
