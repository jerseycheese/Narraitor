import type { World, Character, NarrativeContext, AITestConfig } from '../../types';

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
  const world: World = {
    ...baseWorld,
    ...testConfig.worldOverride
  };
  
  const character: Character = {
    ...baseCharacter,
    ...testConfig.characterOverride
  };
  
  const narrativeContext: NarrativeContext = {
    ...baseNarrativeContext,
    ...testConfig.narrativeContext
  };
  
  return {
    world,
    character,
    narrativeContext
  };
}