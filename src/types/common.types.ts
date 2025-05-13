// src/types/common.types.ts

/**
 * Represents a unique identifier for entities in the system
 */
export type EntityID = string;

/**
 * Represents a timestamp in ISO 8601 format
 */
export type Timestamp = string;

/**
 * Base interface for entities with timestamps
 */
export interface TimestampedEntity {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Base interface for entities with name and description
 */
export interface NamedEntity {
  id: EntityID;
  name: string;
  description?: string;
}
