import { StateInspector } from '../stateInspector';
import { create } from 'zustand';

/**
 * Test store interface for modification testing
 */
interface TestStore {
  // Primitive values for modification testing
  stringValue: string;
  numberValue: number;
  booleanValue: boolean;
  nullValue: null;
  undefinedValue: undefined;
  
  // Nested object for path testing
  nested: {
    deep: {
      value: string;
      count: number;
    };
  };
  
  // Array for testing array modification limitations
  arrayValue: string[];
  
  // Object for testing object modification limitations
  objectValue: { [key: string]: unknown };
  
  // Actions for state modification
  setStringValue: (value: string) => void;
  setNumberValue: (value: number) => void;
  setBooleanValue: (value: boolean) => void;
  setNestedValue: (value: string) => void;
  setNestedCount: (value: number) => void;
}

/**
 * Test store without setState method for error testing
 */
interface ReadOnlyTestStore {
  readOnlyValue: string;
  getState: () => { readOnlyValue: string };
}

/**
 * Create a test store with modification capabilities
 */
function createTestStore() {
  return create<TestStore>()((set) => ({
    stringValue: 'initial string',
    numberValue: 42,
    booleanValue: true,
    nullValue: null,
    undefinedValue: undefined,
    nested: {
      deep: {
        value: 'nested value',
        count: 10
      }
    },
    arrayValue: ['item1', 'item2'],
    objectValue: { key1: 'value1', key2: 42 },
    
    // Actions
    setStringValue: (value: string) => set({ stringValue: value }),
    setNumberValue: (value: number) => set({ numberValue: value }),
    setBooleanValue: (value: boolean) => set({ booleanValue: value }),
    setNestedValue: (value: string) => set((state) => ({
      nested: {
        ...state.nested,
        deep: {
          ...state.nested.deep,
          value
        }
      }
    })),
    setNestedCount: (value: number) => set((state) => ({
      nested: {
        ...state.nested,
        deep: {
          ...state.nested.deep,
          count: value
        }
      }
    }))
  }));
}

/**
 * Create a read-only test store without setState method
 */
function createReadOnlyTestStore(): ReadOnlyTestStore {
  const state = { readOnlyValue: 'readonly' };
  return {
    ...state,
    getState: () => state
  };
}

describe('StateInspector.setValueAtPath', () => {
  let stateInspector: StateInspector;
  let testStore: ReturnType<typeof createTestStore>;
  let readOnlyStore: ReadOnlyTestStore;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Set NODE_ENV to development for tests
    originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    // Create fresh instances for each test
    stateInspector = new StateInspector();
    testStore = createTestStore();
    readOnlyStore = createReadOnlyTestStore();
    
    // Register stores
    stateInspector.registerStores({
      testStore,
      readOnlyStore
    });
  });

  afterEach(() => {
    stateInspector.clearAllWatchers();
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true });
    } else {
      Object.defineProperty(process.env, 'NODE_ENV', { value: undefined, writable: true });
    }
  });

  describe('successful state modifications', () => {
    it('should modify string values at valid paths', () => {
      // Test basic string modification
      const result = stateInspector.setValueAtPath('testStore.stringValue', 'modified string');
      
      expect(result).toBe(true);
      expect(testStore.getState().stringValue).toBe('modified string');
    });

    it('should modify number values at valid paths', () => {
      // Test basic number modification
      const result = stateInspector.setValueAtPath('testStore.numberValue', 100);
      
      expect(result).toBe(true);
      expect(testStore.getState().numberValue).toBe(100);
    });

    it('should modify boolean values at valid paths', () => {
      // Test boolean modification
      const result = stateInspector.setValueAtPath('testStore.booleanValue', false);
      
      expect(result).toBe(true);
      expect(testStore.getState().booleanValue).toBe(false);
    });

    it('should modify nested object path values', () => {
      // Test deep nested string modification
      const result1 = stateInspector.setValueAtPath('testStore.nested.deep.value', 'new nested value');
      expect(result1).toBe(true);
      expect(testStore.getState().nested.deep.value).toBe('new nested value');
      
      // Test deep nested number modification
      const result2 = stateInspector.setValueAtPath('testStore.nested.deep.count', 99);
      expect(result2).toBe(true);
      expect(testStore.getState().nested.deep.count).toBe(99);
    });

    it('should preserve other state properties when modifying single values', () => {
      const initialState = testStore.getState();
      
      // Modify one property
      stateInspector.setValueAtPath('testStore.stringValue', 'changed');
      
      const finalState = testStore.getState();
      
      // Only the modified property should change
      expect(finalState.stringValue).toBe('changed');
      expect(finalState.numberValue).toBe(initialState.numberValue);
      expect(finalState.booleanValue).toBe(initialState.booleanValue);
      expect(finalState.nested).toEqual(initialState.nested);
      expect(finalState.arrayValue).toEqual(initialState.arrayValue);
    });

    it('should handle null and undefined values correctly', () => {
      // Setting to null
      const result1 = stateInspector.setValueAtPath('testStore.stringValue', null);
      expect(result1).toBe(true);
      expect(testStore.getState().stringValue).toBe(null);
      
      // Setting to undefined
      const result2 = stateInspector.setValueAtPath('testStore.numberValue', undefined);
      expect(result2).toBe(true);
      expect(testStore.getState().numberValue).toBe(undefined);
    });
  });

  describe('error conditions', () => {
    it('should reject modifications to invalid paths', () => {
      // Non-existent store
      const result1 = stateInspector.setValueAtPath('nonExistentStore.value', 'test');
      expect(result1).toBe(false);
      
      // Non-existent property path
      const result2 = stateInspector.setValueAtPath('testStore.nonExistentProperty', 'test');
      expect(result2).toBe(false);
      
      // Invalid nested path
      const result3 = stateInspector.setValueAtPath('testStore.stringValue.nonExistent', 'test');
      expect(result3).toBe(false);
    });

    it('should reject type mismatches with validation errors', () => {
      // Try to set string to number field - should reject by type validation
      const result1 = stateInspector.setValueAtPath('testStore.numberValue', 'not a number');
      expect(result1).toBe(false);
      
      // Original value should be unchanged
      expect(testStore.getState().numberValue).toBe(42);
      
      // Try to set number to boolean field - should reject
      const result2 = stateInspector.setValueAtPath('testStore.booleanValue', 123);
      expect(result2).toBe(false);
      
      // Original value should be unchanged
      expect(testStore.getState().booleanValue).toBe(true);
    });

    it('should handle missing store setState methods gracefully', () => {
      // Try to modify read-only store that doesn't have setState
      const result = stateInspector.setValueAtPath('readOnlyStore.readOnlyValue', 'modified');
      
      expect(result).toBe(false);
      expect(readOnlyStore.readOnlyValue).toBe('readonly');
    });

    it('should reject modifications to complex objects and arrays', () => {
      // Arrays should not be modifiable directly
      const result1 = stateInspector.setValueAtPath('testStore.arrayValue', ['new', 'array']);
      expect(result1).toBe(false);
      
      // Objects should not be modifiable directly
      const result2 = stateInspector.setValueAtPath('testStore.objectValue', { new: 'object' });
      expect(result2).toBe(false);
      
      // Nested objects should not be modifiable directly
      const result3 = stateInspector.setValueAtPath('testStore.nested', { new: 'nested' });
      expect(result3).toBe(false);
    });

    it('should handle empty or malformed paths', () => {
      // Empty path
      const result1 = stateInspector.setValueAtPath('', 'value');
      expect(result1).toBe(false);
      
      // Path with only store name
      const result2 = stateInspector.setValueAtPath('testStore', 'value');
      expect(result2).toBe(false);
      
      // Path with extra dots
      const result3 = stateInspector.setValueAtPath('testStore..stringValue', 'value');
      expect(result3).toBe(false);
    });
  });

  describe('type validation', () => {
    it('should validate string types correctly', () => {
      // Valid string values
      expect(stateInspector.setValueAtPath('testStore.stringValue', 'valid string')).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.stringValue', '')).toBe(true);
      
      // Invalid string values (when strict type checking is enabled)
      expect(stateInspector.setValueAtPath('testStore.stringValue', 123)).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.stringValue', true)).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.stringValue', [])).toBe(false);
    });

    it('should validate number types correctly', () => {
      // Valid number values
      expect(stateInspector.setValueAtPath('testStore.numberValue', 123)).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.numberValue', 0)).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.numberValue', -42)).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.numberValue', 3.14)).toBe(true);
      
      // Invalid number values
      expect(stateInspector.setValueAtPath('testStore.numberValue', 'not a number')).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.numberValue', true)).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.numberValue', [])).toBe(false);
    });

    it('should validate boolean types correctly', () => {
      // Valid boolean values
      expect(stateInspector.setValueAtPath('testStore.booleanValue', true)).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.booleanValue', false)).toBe(true);
      
      // Invalid boolean values
      expect(stateInspector.setValueAtPath('testStore.booleanValue', 'true')).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.booleanValue', 1)).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.booleanValue', [])).toBe(false);
    });

    it('should allow null and undefined for any type when originally null/undefined', () => {
      // Set values to null/undefined initially
      expect(stateInspector.setValueAtPath('testStore.stringValue', null)).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.numberValue', undefined)).toBe(true);
      
      // When current value is null/undefined, should accept any type
      expect(stateInspector.setValueAtPath('testStore.stringValue', 'string')).toBe(true);
      expect(stateInspector.setValueAtPath('testStore.numberValue', 456)).toBe(true);
      
      // But after setting to a specific type, should maintain type safety
      expect(stateInspector.setValueAtPath('testStore.stringValue', 123)).toBe(false);
      expect(stateInspector.setValueAtPath('testStore.numberValue', 'string')).toBe(false);
    });
  });

  describe('integration with existing functionality', () => {
    it('should trigger path watchers when values change', async () => {
      const changeCallback = jest.fn();
      
      // Set up a watcher
      const subscription = stateInspector.watchPath('testStore.stringValue', changeCallback);
      
      // Modify the value
      stateInspector.setValueAtPath('testStore.stringValue', 'watched change');
      
      // Wait for debounced change detection
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(changeCallback).toHaveBeenCalledWith(
        'initial string',
        'watched change',
        'testStore.stringValue'
      );
      
      subscription.unsubscribe();
    });

    it('should work with getValueAtPath to verify changes', () => {
      // Set a value
      stateInspector.setValueAtPath('testStore.nested.deep.value', 'verification test');
      
      // Verify with getValueAtPath
      const retrievedValue = stateInspector.getValueAtPath('testStore.nested.deep.value');
      expect(retrievedValue).toBe('verification test');
    });

    it('should update path metadata after modifications', () => {
      // Get initial metadata
      const initialMetadata = stateInspector.getPathMetadata('testStore.stringValue');
      expect(initialMetadata.value).toBe('initial string');
      
      // Modify the value
      stateInspector.setValueAtPath('testStore.stringValue', 'updated value');
      
      // Get updated metadata
      const updatedMetadata = stateInspector.getPathMetadata('testStore.stringValue');
      expect(updatedMetadata.value).toBe('updated value');
      expect(updatedMetadata.type).toBe('string');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle concurrent modifications gracefully', () => {
      // Simulate concurrent modifications
      const result1 = stateInspector.setValueAtPath('testStore.stringValue', 'concurrent1');
      const result2 = stateInspector.setValueAtPath('testStore.stringValue', 'concurrent2');
      const result3 = stateInspector.setValueAtPath('testStore.numberValue', 999);
      
      // All should succeed
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      
      // Final state should reflect the last change
      expect(testStore.getState().stringValue).toBe('concurrent2');
      expect(testStore.getState().numberValue).toBe(999);
    });

    it('should handle modifications during store state changes', () => {
      // Modify state externally first
      testStore.getState().setStringValue('externally changed');
      
      // Then modify through StateInspector
      const result = stateInspector.setValueAtPath('testStore.numberValue', 777);
      
      expect(result).toBe(true);
      expect(testStore.getState().numberValue).toBe(777);
      expect(testStore.getState().stringValue).toBe('externally changed');
    });

    it('should return false when setValueAtPath method does not exist', () => {
      // This test verifies the method exists and can be called
      expect(typeof stateInspector.setValueAtPath).toBe('function');
      
      // When the method doesn't exist, it should return false
      // This will initially fail until the method is implemented
      const result = stateInspector.setValueAtPath('testStore.stringValue', 'test');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('production environment behavior', () => {
    it('should disable modifications in non-development environments', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      
      // Create new inspector in production mode
      const prodInspector = new StateInspector();
      prodInspector.registerStores({ testStore });
      
      // Modifications should be disabled
      const result = prodInspector.setValueAtPath('testStore.stringValue', 'production test');
      expect(result).toBe(false);
      
      // State should not change
      expect(testStore.getState().stringValue).toBe('initial string');
      
      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    });
  });
});