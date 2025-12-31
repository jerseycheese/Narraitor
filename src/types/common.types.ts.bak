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
 * Generated image data
 * Used for AI-generated images attached to entities (characters, worlds, etc.)
 */
export interface GeneratedImage {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}

