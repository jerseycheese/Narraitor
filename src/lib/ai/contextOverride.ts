import type { World, Character, NarrativeContext, AITestConfig } from '../../types';

/**
 * Deep clone utility that works in both browser and Node.js environments
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Creates a test context by merging base game components with test overrides
 */
export function createTestContext(
  baseWorld: World,
  baseCharacter: Character,
  baseNarrativeContext: NarrativeContext,
  testConfig: AITestConfig
): {
  world: World;
  character: Character;
  narrativeContext: NarrativeContext;
} {
  const result = mergeTestOverrides(baseWorld, baseCharacter, baseNarrativeContext, testConfig);
  
  // Apply custom variables to narrative context if provided
  // Note: Custom variables would be stored in a different way in the actual implementation
  
  return result;
}

/**
 * Merges partial overrides with base objects without modifying originals
 */
export function mergeTestOverrides(
  baseWorld: World,
  baseCharacter: Character,
  baseNarrativeContext: NarrativeContext,
  testConfig: AITestConfig
): {
  world: World;
  character: Character;
  narrativeContext: NarrativeContext;
} {
  // Deep clone base objects to avoid mutations
  const world: World = Object.assign(
    deepClone(baseWorld),
    testConfig.worldOverride || {}
  );
  
  const character: Character = Object.assign(
    deepClone(baseCharacter),
    testConfig.characterOverride || {}
  );
  
  const narrativeContext: NarrativeContext = Object.assign(
    deepClone(baseNarrativeContext),
    testConfig.narrativeContext || {}
  );
  
  return {
    world,
    character,
    narrativeContext
  };
}