/**
 * Test helpers for skill-based narrative generation tests
 * Provides shared mocks and utilities for skill tests
 */

import { AIClient } from '../types';
import {
  createMockWorldWithSkills,
  createMockCharacterWithSkills
} from '@/lib/test-utils/testDataFactory';

/**
 * Creates a mock AI client for skill tests
 */
export function createMockAIClient(): jest.Mocked<AIClient> {
  return {
    generateContent: jest.fn()
  };
}

/**
 * Export mock data for use in jest.mock() calls
 */
export const mockWorld = createMockWorldWithSkills({ id: 'skill-world' });
export const mockCharacter = createMockCharacterWithSkills({ id: 'char-1', worldId: 'skill-world' });

// Re-export factory functions for backward compatibility
export { createMockWorldWithSkills, createMockCharacterWithSkills };
