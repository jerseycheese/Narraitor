// src/types/__tests__/common.types.test.ts
import { EntityID, Timestamp, TimestampedEntity, NamedEntity } from '../common.types';

describe('Common Types', () => {
  describe('Type Definitions', () => {
    test('EntityID should accept string values', () => {
      const id: EntityID = 'test-id-123';
      expect(id).toBe('test-id-123');
    });

    test('Timestamp should accept ISO string values', () => {
      const timestamp: Timestamp = '2025-01-13T10:00:00Z';
      expect(timestamp).toBe('2025-01-13T10:00:00Z');
    });

    test('TimestampedEntity should have required timestamp fields', () => {
      const entity: TimestampedEntity = {
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T11:00:00Z'
      };
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    test('NamedEntity should have required and optional fields', () => {
      const entity: NamedEntity = {
        id: 'entity-1',
        name: 'Test Entity',
        description: 'A test entity'
      };
      expect(entity.id).toBe('entity-1');
      expect(entity.name).toBe('Test Entity');
      expect(entity.description).toBe('A test entity');

      // Test optional description
      const minimalEntity: NamedEntity = {
        id: 'entity-2',
        name: 'Minimal Entity'
      };
      expect(minimalEntity.description).toBeUndefined();
    });
  });
});
