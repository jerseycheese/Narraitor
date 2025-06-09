/**
 * Enhanced Test Utilities
 * 
 * Comprehensive test utilities with modular factories and custom assertions
 * for domain-driven testing in the Narraitor application.
 * 
 * Features:
 * - Modular factory pattern for creating test data
 * - Builder pattern for flexible object creation
 * - Custom Jest assertions for domain-specific testing
 * - Mock store utilities for Zustand testing
 * - Collection factories for bulk test data
 * 
 * Usage:
 * ```typescript
 * import { 
 *   WorldFactory, 
 *   CharacterFactory, 
 *   setupCustomMatchers,
 *   createMockWorldStoreState 
 * } from '@/lib/test-utils';
 * 
 * // Setup custom matchers (in test setup file)
 * setupCustomMatchers();
 * 
 * // Create test data with builder pattern
 * const world = WorldFactory.create()
 *   .fantasy()
 *   .withStandardAttributes()
 *   .build();
 * 
 * // Create mock store state
 * const mockWorldStore = createMockWorldStoreState({
 *   worlds: { [world.id]: world },
 *   currentWorldId: world.id
 * });
 * ```
 */

// Test utilities - no imports needed

// Legacy test data creation functions
export {
  createMockWorld,
  createMockCharacter,
  createMockSession,
  createMockNarrativeSegment,
  createMockDecision,
  createMockPlayerChoice,
  createMockJournalEntry,
  createMockInventoryItem,
  createMockWorldList,
  createMockCharacterList,
  createMockWorldStoreState,
  createMockCharacterStoreState
} from './testDataFactory';

// New modular factories
export {
  WorldFactory,
  AttributeFactory,
  SkillFactory,
  WorldCollectionFactory
} from './factories/worldFactory';

export {
  CharacterFactory,
  CharacterAttributeFactory,
  CharacterSkillFactory,
  InventoryItemFactory,
  CharacterCollectionFactory
} from './factories/characterFactory';

export {
  NarrativeSegmentFactory,
  DecisionFactory,
  JournalEntryFactory,
  GameSessionFactory,
  NarrativeCollectionFactory
} from './factories/narrativeFactory';

// Custom Jest assertions
export {
  setupCustomMatchers,
  worldAssertions,
  characterAssertions,
  narrativeAssertions,
  sessionAssertions,
  journalAssertions,
  collectionAssertions
} from './assertions';

// Utility functions and setup
export { createMockStore, createMockWorldStore } from './mockStore';
export { setupTestEnvironment } from './setup';

/**
 * Simple Test Utilities following KISS principle
 */
export class TestUtilities {

  /**
   * Clean up test data for better test isolation
   */
  static cleanup() {
    // Clear any test-specific data
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    // Reset any global test state
    jest.clearAllMocks();
  }

  /**
   * Create a mock IndexedDB adapter for testing
   */
  static createMockIndexedDB() {
    const store = new Map<string, unknown>();
    
    return {
      get: jest.fn((key: string) => Promise.resolve(store.get(key))),
      set: jest.fn((key: string, value: unknown) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      delete: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      keys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
      _store: store // For testing inspection
    };
  }

  /**
   * Create a mock error for testing error handling
   */
  static createMockError(type: 'network' | 'validation' | 'storage' | 'ai' = 'network', message?: string) {
    const errorMessages = {
      network: 'Network error occurred',
      validation: 'Validation failed',
      storage: 'Storage operation failed',
      ai: 'AI service error'
    };

    const error = new Error(message || errorMessages[type]);
    error.name = `${type.charAt(0).toUpperCase() + type.slice(1)}Error`;
    
    return error;
  }
}