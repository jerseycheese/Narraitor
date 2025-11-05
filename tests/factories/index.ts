/**
 * Centralized Test Factories
 *
 * This barrel file exports all test factories for easy importing across the test suite.
 *
 * Usage:
 * ```typescript
 * import { worldFactory, characterFactory } from '@/tests/factories';
 *
 * const world = worldFactory.build({ name: 'Custom World' });
 * const character = characterFactory.build({ worldId: world.id });
 * ```
 */

export {
  worldFactory,
  worldAttributeFactory,
  worldSkillFactory,
} from './worldFactory';

export {
  characterFactory,
  characterAttributeFactory,
  characterSkillFactory,
} from './characterFactory';

export { sessionFactory } from './sessionFactory';
