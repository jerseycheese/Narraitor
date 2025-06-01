/**
 * Common type definitions used across the application
 */

/**
 * Entity ID type
 */
export type EntityID = string;

/**
 * ISO datetime string type
 */
export type ISODateString = string;

/**
 * Named entity interface
 */
export interface NamedEntity {
  id: EntityID;
  name: string;
  description: string;
}

/**
 * Timestamped entity interface
 */
export interface TimestampedEntity {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Result type for operations
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
