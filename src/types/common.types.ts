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
 * Image attached to an entity (characters, worlds, etc.).
 * `preset` is one of the built-in avatars; `uploaded` is a player's own file.
 */
export interface GeneratedImage {
  type: 'ai-generated' | 'placeholder' | 'preset' | 'uploaded';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}

