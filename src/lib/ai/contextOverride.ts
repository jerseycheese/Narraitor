import type { World, Character, NarrativeContext, AITestConfig } from '../../types';

const cloneContextValue = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

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
  return mergeTestOverrides(baseWorld, baseCharacter, baseNarrativeContext, testConfig);
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
  const world: World = Object.assign(
    cloneContextValue(baseWorld),
    testConfig.worldOverride || {}
  );
  
  const character: Character = Object.assign(
    cloneContextValue(baseCharacter),
    testConfig.characterOverride || {}
  );
  
  const narrativeContext: NarrativeContext = Object.assign(
    cloneContextValue(baseNarrativeContext),
    testConfig.narrativeContext || {}
  );
  
  return {
    world,
    character,
    narrativeContext
  };
}
