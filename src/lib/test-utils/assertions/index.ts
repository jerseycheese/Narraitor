/**
 * Custom Jest assertions for domain-specific testing
 * Provides readable, reusable assertions for common test patterns
 */

import type { 
  World, 
  Character, 
  NarrativeSegment, 
  GameSession, 
  JournalEntry 
} from '@/types';

/**
 * World-specific assertions
 */
export const worldAssertions = {
  /**
   * Assert that a world has the expected basic structure
   */
  toBeValidWorld(world: unknown): jest.CustomMatcherResult {
    if (!world || typeof world !== 'object') {
      return {
        pass: false,
        message: () => 'Expected value to be a world object'
      };
    }

    const w = world as World;
    const requiredFields = ['id', 'name', 'theme', 'attributes', 'skills', 'settings'];
    const missingFields = requiredFields.filter(field => !(field in w));

    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `World is missing required fields: ${missingFields.join(', ')}`
      };
    }

    return {
      pass: true,
      message: () => 'World has valid structure'
    };
  },

  /**
   * Assert that a world has a specific theme
   */
  toHaveTheme(world: World, expectedTheme: string): jest.CustomMatcherResult {
    const pass = world.theme === expectedTheme;
    return {
      pass,
      message: () => pass
        ? `Expected world not to have theme "${expectedTheme}"`
        : `Expected world to have theme "${expectedTheme}", but got "${world.theme}"`
    };
  },

  /**
   * Assert that a world has a specific number of attributes
   */
  toHaveAttributeCount(world: World, expectedCount: number): jest.CustomMatcherResult {
    const actualCount = world.attributes?.length || 0;
    const pass = actualCount === expectedCount;
    return {
      pass,
      message: () => pass
        ? `Expected world not to have ${expectedCount} attributes`
        : `Expected world to have ${expectedCount} attributes, but got ${actualCount}`
    };
  },

  /**
   * Assert that a world has a specific attribute by name
   */
  toHaveWorldAttribute(world: World, attributeName: string): jest.CustomMatcherResult {
    // Check if world.attributes is an array and has the attribute
    const hasAttribute = Array.isArray(world.attributes) && 
      world.attributes.some(attr => attr && typeof attr === 'object' && 'name' in attr && attr.name === attributeName);
    return {
      pass: hasAttribute,
      message: () => hasAttribute
        ? `Expected world not to have attribute "${attributeName}"`
        : `Expected world to have attribute "${attributeName}"`
    };
  },

  /**
   * Assert that a world settings are within valid ranges
   */
  toHaveValidSettings(world: World): jest.CustomMatcherResult {
    const settings = world.settings;
    if (!settings) {
      return {
        pass: false,
        message: () => 'World has no settings'
      };
    }

    const issues: string[] = [];

    if (settings.maxAttributes <= 0) {
      issues.push('maxAttributes must be positive');
    }
    if (settings.maxSkills <= 0) {
      issues.push('maxSkills must be positive');
    }
    if (settings.attributePointPool <= 0) {
      issues.push('attributePointPool must be positive');
    }
    if (settings.skillPointPool <= 0) {
      issues.push('skillPointPool must be positive');
    }

    const pass = issues.length === 0;
    return {
      pass,
      message: () => pass
        ? 'World settings are valid'
        : `World settings have issues: ${issues.join(', ')}`
    };
  }
};

/**
 * Character-specific assertions
 */
export const characterAssertions = {
  /**
   * Assert that a character has the expected basic structure
   */
  toBeValidCharacter(character: unknown): jest.CustomMatcherResult {
    if (!character || typeof character !== 'object') {
      return {
        pass: false,
        message: () => 'Expected value to be a character object'
      };
    }

    const c = character as Character;
    const requiredFields = ['id', 'worldId', 'name', 'attributes', 'skills', 'background', 'inventory', 'status'];
    const missingFields = requiredFields.filter(field => !(field in c));

    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Character is missing required fields: ${missingFields.join(', ')}`
      };
    }

    return {
      pass: true,
      message: () => 'Character has valid structure'
    };
  },

  /**
   * Assert that a character belongs to a specific world
   */
  toBelongToWorld(character: Character, worldId: string): jest.CustomMatcherResult {
    const pass = character.worldId === worldId;
    return {
      pass,
      message: () => pass
        ? `Expected character not to belong to world "${worldId}"`
        : `Expected character to belong to world "${worldId}", but belongs to "${character.worldId}"`
    };
  },

  /**
   * Assert that a character has a specific attribute value
   */
  toHaveAttributeValue(character: Character, attributeId: string, expectedValue: number): jest.CustomMatcherResult {
    const attribute = character.attributes?.find(attr => attr.attributeId === attributeId);
    
    if (!attribute) {
      return {
        pass: false,
        message: () => `Character does not have attribute "${attributeId}"`
      };
    }

    const pass = attribute.value === expectedValue;
    return {
      pass,
      message: () => pass
        ? `Expected character attribute "${attributeId}" not to have value ${expectedValue}`
        : `Expected character attribute "${attributeId}" to have value ${expectedValue}, but got ${attribute.value}`
    };
  },

  /**
   * Assert that a character has an active skill
   */
  toHaveActiveSkill(character: Character, skillId: string): jest.CustomMatcherResult {
    const skill = character.skills?.find(s => s.skillId === skillId);
    
    if (!skill) {
      return {
        pass: false,
        message: () => `Character does not have skill "${skillId}"`
      };
    }

    const pass = skill.isActive === true;
    return {
      pass,
      message: () => pass
        ? `Expected character not to have active skill "${skillId}"`
        : `Expected character to have active skill "${skillId}"`
    };
  },

  /**
   * Assert that a character's health is within expected range
   */
  toHaveHealthInRange(character: Character, min: number, max: number): jest.CustomMatcherResult {
    const health = character.status?.health;
    
    if (health === undefined) {
      return {
        pass: false,
        message: () => 'Character has no health status'
      };
    }

    const pass = health >= min && health <= max;
    return {
      pass,
      message: () => pass
        ? `Expected character health not to be between ${min} and ${max}`
        : `Expected character health to be between ${min} and ${max}, but got ${health}`
    };
  }
};

/**
 * Narrative-specific assertions
 */
export const narrativeAssertions = {
  /**
   * Assert that a narrative segment has valid structure
   */
  toBeValidNarrativeSegment(segment: unknown): jest.CustomMatcherResult {
    if (!segment || typeof segment !== 'object') {
      return {
        pass: false,
        message: () => 'Expected value to be a narrative segment object'
      };
    }

    const s = segment as NarrativeSegment;
    const requiredFields = ['id', 'worldId', 'sessionId', 'content', 'type', 'timestamp'];
    const missingFields = requiredFields.filter(field => !(field in s));

    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Narrative segment is missing required fields: ${missingFields.join(', ')}`
      };
    }

    return {
      pass: true,
      message: () => 'Narrative segment has valid structure'
    };
  },

  /**
   * Assert that a narrative segment has specific content
   */
  toContainContent(segment: NarrativeSegment, expectedContent: string): jest.CustomMatcherResult {
    const pass = segment.content.includes(expectedContent);
    return {
      pass,
      message: () => pass
        ? `Expected segment not to contain "${expectedContent}"`
        : `Expected segment to contain "${expectedContent}", but content was "${segment.content}"`
    };
  },

  /**
   * Assert that a narrative segment has a specific type
   */
  toHaveType(segment: NarrativeSegment, expectedType: string): jest.CustomMatcherResult {
    const pass = segment.type === expectedType;
    return {
      pass,
      message: () => pass
        ? `Expected segment not to have type "${expectedType}"`
        : `Expected segment to have type "${expectedType}", but got "${segment.type}"`
    };
  }
};

/**
 * Game session assertions
 */
export const sessionAssertions = {
  /**
   * Assert that a session is active
   */
  toBeActiveSession(session: GameSession): jest.CustomMatcherResult {
    const pass = session.state.status === 'active';
    return {
      pass,
      message: () => pass
        ? 'Expected session not to be active'
        : `Expected session to be active, but status is "${session.state.status}"`
    };
  },

  /**
   * Assert that a session has narrative history
   */
  toHaveNarrativeHistory(session: GameSession, expectedLength?: number): jest.CustomMatcherResult {
    const historyLength = session.narrativeHistory?.length || 0;
    
    if (expectedLength !== undefined) {
      const pass = historyLength === expectedLength;
      return {
        pass,
        message: () => pass
          ? `Expected session not to have ${expectedLength} narrative segments`
          : `Expected session to have ${expectedLength} narrative segments, but got ${historyLength}`
      };
    }

    const pass = historyLength > 0;
    return {
      pass,
      message: () => pass
        ? 'Expected session not to have narrative history'
        : 'Expected session to have narrative history'
    };
  },

  /**
   * Assert that a session has a specific current location
   */
  toBeInLocation(session: GameSession, expectedLocation: string): jest.CustomMatcherResult {
    const currentLocation = session.currentContext?.currentLocation;
    const pass = currentLocation === expectedLocation;
    return {
      pass,
      message: () => pass
        ? `Expected session not to be in location "${expectedLocation}"`
        : `Expected session to be in location "${expectedLocation}", but is in "${currentLocation}"`
    };
  }
};

/**
 * Journal assertions
 */
export const journalAssertions = {
  /**
   * Assert that a journal entry has valid structure
   */
  toBeValidJournalEntry(entry: unknown): jest.CustomMatcherResult {
    if (!entry || typeof entry !== 'object') {
      return {
        pass: false,
        message: () => 'Expected value to be a journal entry object'
      };
    }

    const e = entry as JournalEntry;
    const requiredFields = ['id', 'sessionId', 'type', 'title', 'content', 'significance', 'isRead'];
    const missingFields = requiredFields.filter(field => !(field in e));

    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Journal entry is missing required fields: ${missingFields.join(', ')}`
      };
    }

    return {
      pass: true,
      message: () => 'Journal entry has valid structure'
    };
  },

  /**
   * Assert that a journal entry is read/unread
   */
  toBeRead(entry: JournalEntry): jest.CustomMatcherResult {
    const pass = entry.isRead === true;
    return {
      pass,
      message: () => pass
        ? 'Expected journal entry not to be read'
        : 'Expected journal entry to be read'
    };
  },

  /**
   * Assert that a journal entry has specific significance
   */
  toHaveSignificance(entry: JournalEntry, expectedSignificance: string): jest.CustomMatcherResult {
    const pass = entry.significance === expectedSignificance;
    return {
      pass,
      message: () => pass
        ? `Expected journal entry not to have significance "${expectedSignificance}"`
        : `Expected journal entry to have significance "${expectedSignificance}", but got "${entry.significance}"`
    };
  }
};

/**
 * Collection assertions for testing arrays and objects
 */
export const collectionAssertions = {
  /**
   * Assert that an array contains only valid objects of a specific type
   */
  toContainOnlyValidWorlds(collection: unknown[]): jest.CustomMatcherResult {
    const invalidItems = collection.filter(item => {
      const result = worldAssertions.toBeValidWorld(item);
      return !result.pass;
    });

    const pass = invalidItems.length === 0;
    return {
      pass,
      message: () => pass
        ? 'All items in collection are valid worlds'
        : `Collection contains ${invalidItems.length} invalid world objects`
    };
  },

  /**
   * Assert that a collection has expected length
   */
  toHaveLength(collection: unknown[], expectedLength: number): jest.CustomMatcherResult {
    const actualLength = collection.length;
    const pass = actualLength === expectedLength;
    return {
      pass,
      message: () => pass
        ? `Expected collection not to have length ${expectedLength}`
        : `Expected collection to have length ${expectedLength}, but got ${actualLength}`
    };
  },

  /**
   * Assert that all items in a collection belong to the same world
   */
  toAllBelongToWorld(collection: Array<{ worldId: string }>, worldId: string): jest.CustomMatcherResult {
    const invalidItems = collection.filter(item => item.worldId !== worldId);
    const pass = invalidItems.length === 0;
    return {
      pass,
      message: () => pass
        ? `All items belong to world "${worldId}"`
        : `${invalidItems.length} items do not belong to world "${worldId}"`
    };
  }
};

/**
 * Register all custom matchers with Jest
 */
export function setupCustomMatchers(): void {
  expect.extend({
    // World matchers
    toBeValidWorld: worldAssertions.toBeValidWorld,
    toHaveTheme: worldAssertions.toHaveTheme,
    toHaveAttributeCount: worldAssertions.toHaveAttributeCount,
    toHaveWorldAttribute: worldAssertions.toHaveWorldAttribute,
    toHaveValidSettings: worldAssertions.toHaveValidSettings,

    // Character matchers
    toBeValidCharacter: characterAssertions.toBeValidCharacter,
    toBelongToWorld: characterAssertions.toBelongToWorld,
    toHaveAttributeValue: characterAssertions.toHaveAttributeValue,
    toHaveActiveSkill: characterAssertions.toHaveActiveSkill,
    toHaveHealthInRange: characterAssertions.toHaveHealthInRange,

    // Narrative matchers
    toBeValidNarrativeSegment: narrativeAssertions.toBeValidNarrativeSegment,
    toContainContent: narrativeAssertions.toContainContent,
    toHaveType: narrativeAssertions.toHaveType,

    // Session matchers
    toBeActiveSession: sessionAssertions.toBeActiveSession,
    toHaveNarrativeHistory: sessionAssertions.toHaveNarrativeHistory,
    toBeInLocation: sessionAssertions.toBeInLocation,

    // Journal matchers
    toBeValidJournalEntry: journalAssertions.toBeValidJournalEntry,
    toBeRead: journalAssertions.toBeRead,
    toHaveSignificance: journalAssertions.toHaveSignificance,

    // Collection matchers
    toContainOnlyValidWorlds: collectionAssertions.toContainOnlyValidWorlds,
    toHaveLength: collectionAssertions.toHaveLength,
    toAllBelongToWorld: collectionAssertions.toAllBelongToWorld
  });
}

// Type declarations moved to jest setup to avoid ESLint namespace issues