/**
 * Centralized test timer utilities for consistent time mocking across test suites.
 *
 * This utility provides a single source of truth for setting up fake timers in tests,
 * ensuring consistent behavior and eliminating duplicate implementations.
 */

/**
 * Sets up fake timers for testing with a consistent test time.
 *
 * This function:
 * - Enables Jest's fake timers
 * - Sets a fixed system time for consistent test results
 *
 * @example
 * ```typescript
 * import { setupTestTimers } from '@/lib/test-utils/testTimers';
 *
 * beforeEach(() => {
 *   setupTestTimers();
 * });
 *
 * afterEach(() => {
 *   jest.useRealTimers();
 * });
 * ```
 */
export function setupTestTimers(): void {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
}

/**
 * Cleans up fake timers and restores real timers.
 *
 * Should be called in afterEach to ensure test isolation.
 */
export function cleanupTestTimers(): void {
  jest.useRealTimers();
}
